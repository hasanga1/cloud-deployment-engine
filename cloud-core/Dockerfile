# Start with a base Java image
FROM eclipse-temurin:21-jdk

# Set working directory
WORKDIR /app

# Copy the built jar file into the image
# Note: Run 'mvn clean package -DskipTests' first to generate this jar!
COPY target/*.jar app.jar

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]