package com.smartcampus.config;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

/**
 * Explicit MongoDB configuration that bypasses Spring Boot's auto-configuration
 * to ensure the Atlas URI from .env is used correctly.
 *
 * Spring Boot 4.0's MongoPropertiesClientSettingsBuilderCustomizer has issues
 * with mongodb+srv:// URIs when the URI is injected via SpringApplicationBuilder,
 * so we programmatically create the MongoClient here instead.
 */
@Configuration
public class MongoConfig {

    @Bean
    public MongoClient mongoClient() {
        // Load the URI from .env (or fall back to the hardcoded Atlas URI)
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        String uri = dotenv.get("MONGODB_URI",
                "mongodb+srv://unicollab970_db_user:unicollab123@cluster0.cgmi5se.mongodb.net/SmartCampus?retryWrites=true&w=majority&appName=Cluster0");

        System.out.println("=== MongoConfig: Connecting to: " + uri.replaceAll(":([^@]+)@", ":****@") + " ===");

        ConnectionString connectionString = new ConnectionString(uri);
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .build();

        return MongoClients.create(settings);
    }

    @Bean
    public MongoDatabaseFactory mongoDatabaseFactory(MongoClient mongoClient) {
        // Extract DB name from URI, default to "SmartCampus"
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        String uri = dotenv.get("MONGODB_URI",
                "mongodb+srv://unicollab970_db_user:unicollab123@cluster0.cgmi5se.mongodb.net/SmartCampus?retryWrites=true&w=majority&appName=Cluster0");
        ConnectionString connectionString = new ConnectionString(uri);
        String dbName = connectionString.getDatabase() != null ? connectionString.getDatabase() : "SmartCampus";
        return new SimpleMongoClientDatabaseFactory(mongoClient, dbName);
    }

    @Bean
    public MongoTemplate mongoTemplate(MongoDatabaseFactory mongoDatabaseFactory) {
        return new MongoTemplate(mongoDatabaseFactory);
    }
}
