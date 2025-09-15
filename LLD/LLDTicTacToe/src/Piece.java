public class Piece {
    int x;
    int y;
    char type; // 'X' or 'O'

    public Piece(int x, int y, char type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }

    public char getType() {
        return type;
    }
}
