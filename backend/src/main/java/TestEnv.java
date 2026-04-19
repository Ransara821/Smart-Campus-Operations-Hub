import io.github.cdimascio.dotenv.Dotenv;

public class TestEnv {
    public static void main(String[] args) {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        System.out.println("MONGODB_URI is: " + dotenv.get("MONGODB_URI"));
    }
}
