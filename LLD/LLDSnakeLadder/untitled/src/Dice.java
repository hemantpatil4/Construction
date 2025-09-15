public class Dice {
    // Fields
    private int sides;

    // Constructor
    public Dice(int sides) {
        this.sides = sides;
    }

    // Method signatures
    public int roll() {
        //1====sides
        int res=(int)(Math.random()*sides)+1;
        return res;
    }

    public int getSides() {
        return sides;
    }
}

