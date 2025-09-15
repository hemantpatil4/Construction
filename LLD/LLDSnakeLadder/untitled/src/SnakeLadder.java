public class SnakeLadder {
    // Enum for type
    public enum Type {
        SNAKE,
        LADDER
    }

    // Fields
    private int start;
    private int end;
    private Type type;

    // Constructor
    public SnakeLadder(int start, int end, Type type) {
        this.start = start;
        this.end = end;
        this.type = type;
    }

    // Method signatures
    public int getStart() {
        return start;
    }

    public int getEnd() {
        return end;
    }

    public Type getType() {
        return type;
    }
}

