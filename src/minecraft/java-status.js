import net from 'node:net';

function encodeVarInt(value) {
  let number = value >>> 0;
  const bytes = [];
  do {
    let byte = number & 0x7f;
    number >>>= 7;
    if (number !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (number !== 0);
  return Buffer.from(bytes);
}

function decodeVarInt(buffer, offset = 0) {
  let value = 0;
  let position = offset;
  let shift = 0;

  while (position < buffer.length && shift < 35) {
    const byte = buffer[position++];
    value |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      return { value: value >>> 0, size: position - offset };
    }
    shift += 7;
  }

  if (position >= buffer.length) return null;
  throw new Error('Invalid VarInt in Minecraft response.');
}

function encodeString(value) {
  const data = Buffer.from(value, 'utf8');
  return Buffer.concat([encodeVarInt(data.length), data]);
}

function makePacket(payload) {
  return Buffer.concat([encodeVarInt(payload.length), payload]);
}

function flattenDescription(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(flattenDescription).join('');
  if (!value || typeof value !== 'object') return '';
  let result = typeof value.text === 'string' ? value.text : '';
  if (Array.isArray(value.extra)) {
    result += value.extra.map(flattenDescription).join('');
  }
  return result;
}

/** Query a Minecraft Java Edition server using the standard status protocol. */
export function getJavaServerStatus({ host, port = 25565, timeoutMs = 5000 }) {
  if (!host || typeof host !== 'string') {
    return Promise.reject(new TypeError('A Minecraft server host is required.'));
  }
  if (!Number.isInteger(Number(port)) || Number(port) < 1 || Number(port) > 65535) {
    return Promise.reject(new RangeError('Minecraft port must be between 1 and 65535.'));
  }

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: Number(port) });
    let buffer = Buffer.alloc(0);
    let settled = false;

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('timeout', () => finish(new Error('Minecraft server status request timed out.')));
    socket.once('error', (error) => finish(new Error(`Could not reach Minecraft server: ${error.message}`)));

    socket.once('connect', () => {
      const address = encodeString(host);
      const handshake = Buffer.concat([
        encodeVarInt(0x00),
        encodeVarInt(0), // Status protocol version: 0 is commonly accepted for status pings.
        address,
        Buffer.from([(Number(port) >> 8) & 0xff, Number(port) & 0xff]),
        encodeVarInt(1), // Next state: status.
      ]);
      socket.write(makePacket(handshake));
      socket.write(makePacket(encodeVarInt(0x00))); // Status request.
    });

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const frameLength = decodeVarInt(buffer, 0);
      if (!frameLength) return;
      const frameStart = frameLength.size;
      if (buffer.length < frameStart + frameLength.value) return;

      const packet = buffer.subarray(frameStart, frameStart + frameLength.value);
      const packetId = decodeVarInt(packet, 0);
      if (!packetId || packetId.value !== 0x00) {
        finish(new Error('Unexpected Minecraft status response.'));
        return;
      }

      const stringLength = decodeVarInt(packet, packetId.size);
      if (!stringLength) {
        finish(new Error('Incomplete Minecraft status response.'));
        return;
      }
      const jsonStart = packetId.size + stringLength.size;
      const jsonEnd = jsonStart + stringLength.value;
      if (jsonEnd > packet.length) {
        finish(new Error('Malformed Minecraft status response.'));
        return;
      }

      try {
        const status = JSON.parse(packet.toString('utf8', jsonStart, jsonEnd));
        finish(null, {
          online: true,
          version: status.version?.name ?? 'Unknown',
          playersOnline: Number(status.players?.online ?? 0),
          playersMax: Number(status.players?.max ?? 0),
          description: flattenDescription(status.description) || 'No server description',
          favicon: typeof status.favicon === 'string' ? status.favicon : null,
        });
      } catch (error) {
        finish(new Error(`Could not parse Minecraft status response: ${error.message}`));
      }
    });
  });
}

export const __testables = { encodeVarInt, decodeVarInt, flattenDescription };
