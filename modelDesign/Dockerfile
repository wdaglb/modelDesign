FROM maven:3.9.9-eclipse-temurin-17 AS builder

WORKDIR /app

COPY . .

RUN mvn -pl boot -am clean package -Dmaven.test.skip=true

FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

COPY --from=builder /app/boot/target/boot-0.0.1-SNAPSHOT.jar /app/app.jar

RUN mkdir -p /app/storage

EXPOSE 9999

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
