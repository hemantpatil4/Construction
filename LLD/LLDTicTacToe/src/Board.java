public class Board {
    private int size;
    private char[][] grid;

    public Board(int size) {
        this.size = size;
        this.grid = new char[size][size];
        // Initialize grid with empty values
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                grid[i][j] = '|';
            }
        }
    }
    public boolean placePiece(int x, int y, char type) {
        if (x < 0 || x >= size || y < 0 || y >= size || grid[x][y] != '|') {
            return false;
        }
        grid[x][y] = type;
        return true;
    }
    public char[][] getGrid() {
        return grid;
    }
    public int getSize() {
        return size;
    }
    public void printBoard(){
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                System.out.print( " " +grid[i][j]+" ");
            }
            System.out.println();
        }
    }

    public boolean isWinnerPresent(char c){
        return isWinnerPresentHorizontal(c) || isWinnerPresentVertical(c) || isWinnerPresentDiagonal1(c) || isWinnerPresentDiagonal2(c);    }

    public boolean isWinnerPresentHorizontal(char c){
        int counter=0;
        for (int i = 0; i < size; i++) {
            counter=0;
            for (int j = 0; j < size; j++) {
                if(grid[i][j]==c){
                    counter++;
                }
            }
            if(counter==size){
                return true;
            }
        }
        return false;
    }

    public boolean isWinnerPresentVertical(char c){
        int counter=0;
        for (int i = 0; i < size; i++) {
            counter=0;
            for (int j = 0; j < size; j++) {
                if(grid[j][i]==c){
                    counter++;
                }
            }
            if(counter==size){
                return true;
            }
        }
        return false;
    }


    public boolean isWinnerPresentDiagonal1(char c){
        int counter=0;
        for (int i = 0; i < size; i++) {
            if(grid[i][i]==c){
                counter++;
            }
            if(counter==size){
                return true;
            }
        }
        return false;
    }

    public boolean isWinnerPresentDiagonal2(char c){
        int counter=0;
        for (int i = 0; i < size; i++) {
            if(grid[size-i-1][size-i-1]==c){
                counter++;
            }
            if(counter==size){
                return true;
            }
        }
        return false;
    }


}


