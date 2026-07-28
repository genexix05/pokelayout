namespace PokeLayout.Services;

/// <summary>
/// Lector parcial de Ruby Marshal 4.8 (saves de RPG Maker / Pokémon Essentials).
/// </summary>
internal sealed class RubyMarshalReader
{
    private readonly byte[] _data;
    private int _pos;
    private readonly List<object?> _symbols = new();
    private readonly List<object?> _objects = new();

    public RubyMarshalReader(byte[] data)
    {
        _data = data;
    }

    public object? Load()
    {
        if (_data.Length < 3)
            throw new InvalidDataException("Archivo Marshal demasiado corto.");

        var major = ReadByte();
        var minor = ReadByte();
        if (major != 4 || minor != 8)
            throw new InvalidDataException($"Marshal no soportado: {major}.{minor}");

        return ReadValue();
    }

    /// <summary>
    /// Carga todos los objetos Marshal del archivo (v19+ = 1 hash; pre-v19 = varios dumps).
    /// </summary>
    public List<object?> LoadAll()
    {
        var results = new List<object?>();

        while (_pos + 2 < _data.Length)
        {
            try
            {
                _symbols.Clear();
                _objects.Clear();

                var major = ReadByte();
                var minor = ReadByte();
                if (major != 4 || minor > 8)
                    break;

                results.Add(ReadValue());
            }
            catch
            {
                break;
            }
        }

        if (results.Count == 0)
            throw new InvalidDataException("No se pudo leer ningún objeto Marshal.");

        return results;
    }

    private object? ReadValue()
    {
        var type = (char)ReadByte();

        switch (type)
        {
            case '0': return null;
            case 'T': return true;
            case 'F': return false;
            case 'i': return ReadLong();
            case 'l': return ReadBignum();
            case 'f': return ReadFloat();
            case ':': return ReadSymbol();
            case ';': return ReadSymbolLink();
            case '"': return ReadString();
            case 'I': return ReadIvar();
            case '[': return ReadArray();
            case '{': return ReadHash(hasDefault: false);
            case '}': return ReadHash(hasDefault: true);
            case 'o': return ReadObject();
            case '@': return ReadObjectLink();
            case 'u': return ReadUserDef();
            case 'U': return ReadUserMarshal();
            case 'c': return ReadClassOrModule();
            case 'm': return ReadClassOrModule();
            case 'e': ReadValue(); return ReadValue(); // extended
            case 'C': ReadValue(); return ReadValue(); // user class wrapper
            case '/': return ReadRegexp();
            case 'S': return ReadStruct();
            default:
                throw new InvalidDataException($"Tipo Marshal desconocido '{type}' en offset {_pos - 1}.");
        }
    }

    private byte ReadByte()
    {
        if (_pos >= _data.Length)
            throw new EndOfStreamException();
        return _data[_pos++];
    }

    private byte[] ReadBytes(int count)
    {
        if (_pos + count > _data.Length)
            throw new EndOfStreamException();
        var slice = new byte[count];
        Buffer.BlockCopy(_data, _pos, slice, 0, count);
        _pos += count;
        return slice;
    }

    private int ReadLong()
    {
        var c = (sbyte)ReadByte();
        if (c == 0) return 0;
        if (c > 0)
        {
            if (c > 4) return c - 5;
            int result = 0;
            for (int i = 0; i < c; i++)
                result |= ReadByte() << (8 * i);
            return result;
        }

        if (c < -4) return c + 5;
        int neg = -1;
        for (int i = 0; i < -c; i++)
        {
            neg &= ~(0xFF << (8 * i));
            neg |= ReadByte() << (8 * i);
        }
        return neg;
    }

    private object ReadBignum()
    {
        var sign = (char)ReadByte();
        var length = ReadLong();
        var raw = ReadBytes(length * 2);
        // Suficiente para IDs/timestamps; se expone como long si cabe
        if (raw.Length <= 8)
        {
            ulong n = 0;
            for (int i = 0; i < raw.Length; i++)
                n |= (ulong)raw[i] << (8 * i);
            long signed = (long)n;
            return sign == '-' ? -signed : signed;
        }
        return raw;
    }

    private object ReadFloat()
    {
        var s = System.Text.Encoding.ASCII.GetString(ReadBytes(ReadLong()));
        Register(s);
        if (s is "nan" or "inf" or "-inf") return s;
        return double.Parse(s, System.Globalization.CultureInfo.InvariantCulture);
    }

    private string ReadSymbol()
    {
        var s = System.Text.Encoding.UTF8.GetString(ReadBytes(ReadLong()));
        _symbols.Add(s);
        return s;
    }

    private object? ReadSymbolLink()
    {
        var idx = ReadLong();
        if (idx < 0 || idx >= _symbols.Count)
            throw new InvalidDataException($"Symbol link inválido: {idx}");
        return _symbols[idx];
    }

    private string ReadString()
    {
        var s = System.Text.Encoding.UTF8.GetString(ReadBytes(ReadLong()));
        Register(s);
        return s;
    }

    private object? ReadIvar()
    {
        var obj = ReadValue();
        var count = ReadLong();
        for (int i = 0; i < count; i++)
        {
            ReadValue(); // key
            ReadValue(); // value (encoding, etc.)
        }
        return obj;
    }

    private List<object?> ReadArray()
    {
        var n = ReadLong();
        var arr = new List<object?>(n);
        Register(arr);
        for (int i = 0; i < n; i++)
            arr.Add(ReadValue());
        return arr;
    }

    private Dictionary<string, object?> ReadHash(bool hasDefault)
    {
        var n = ReadLong();
        var hash = new Dictionary<string, object?>(StringComparer.Ordinal);
        Register(hash);
        for (int i = 0; i < n; i++)
        {
            var key = ReadValue();
            var val = ReadValue();
            hash[KeyToString(key)] = val;
        }
        if (hasDefault)
            hash["__default__"] = ReadValue();
        return hash;
    }

    private Dictionary<string, object?> ReadObject()
    {
        var className = ReadValue();
        var n = ReadLong();
        var obj = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["__class__"] = className
        };
        Register(obj);
        for (int i = 0; i < n; i++)
        {
            var key = ReadValue();
            var val = ReadValue();
            var keyStr = KeyToString(key);
            // En Marshal las ivars vienen como "@name"; también aceptamos sin @
            if (keyStr.StartsWith('@'))
                keyStr = keyStr[1..];
            obj[keyStr] = val;
        }
        return obj;
    }

    private object? ReadObjectLink()
    {
        var idx = ReadLong();
        if (idx < 1 || idx > _objects.Count)
            return $"<link:{idx}>";
        return _objects[idx - 1];
    }

    private Dictionary<string, object?> ReadUserDef()
    {
        var className = ReadValue();
        var raw = ReadBytes(ReadLong());
        var obj = new Dictionary<string, object?>
        {
            ["__class__"] = className,
            ["__userdef__"] = raw
        };
        Register(obj);
        return obj;
    }

    private Dictionary<string, object?> ReadUserMarshal()
    {
        var className = ReadValue();
        var obj = new Dictionary<string, object?> { ["__class__"] = className };
        Register(obj);
        obj["__data__"] = ReadValue();
        return obj;
    }

    private string ReadClassOrModule()
    {
        var name = System.Text.Encoding.UTF8.GetString(ReadBytes(ReadLong()));
        Register(name);
        return name;
    }

    private Dictionary<string, object?> ReadRegexp()
    {
        var pattern = ReadBytes(ReadLong());
        var opts = ReadByte();
        var obj = new Dictionary<string, object?>
        {
            ["__regexp__"] = pattern,
            ["opts"] = opts
        };
        Register(obj);
        return obj;
    }

    private Dictionary<string, object?> ReadStruct()
    {
        var name = ReadValue();
        var n = ReadLong();
        var obj = new Dictionary<string, object?> { ["__struct__"] = name };
        Register(obj);
        for (int i = 0; i < n; i++)
        {
            var key = KeyToString(ReadValue());
            if (key.StartsWith('@')) key = key[1..];
            obj[key] = ReadValue();
        }
        return obj;
    }

    private void Register(object? obj) => _objects.Add(obj);

    private static string KeyToString(object? key) => key switch
    {
        null => "null",
        string s => s,
        bool b => b ? "true" : "false",
        int i => i.ToString(),
        long l => l.ToString(),
        _ => key.ToString() ?? "null"
    };
}
