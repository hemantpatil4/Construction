public class Player {
    private String name;
    private char pieceType; // 'X' or 'O'
    private int id;

    public Player(String name, char pieceType, int id) {
        this.name = name;
        this.pieceType = pieceType;
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public char getPieceType() {
        return pieceType;
    }

    public int getId() {
        return id;
    }
}

