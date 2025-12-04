package com.cloud.core.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Component
public class EncryptionUtil {

    @Value("${app.encryption.secret:e9049fb8caaf38add655315bb6728869a93eec9cef675cfb57d43a64206dfb1d}")
    private String secretKey;

    private static final String ALGORITHM = "AES";

    /**
     * Derives a valid AES key from the secret string using SHA-256 hash
     */
    private SecretKeySpec getKey() throws Exception {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] key = sha.digest(secretKey.getBytes(StandardCharsets.UTF_8));
        // Use first 16 bytes for AES-128 (or 32 bytes for AES-256)
        byte[] keyBytes = new byte[16];
        System.arraycopy(key, 0, keyBytes, 0, 16);
        return new SecretKeySpec(keyBytes, ALGORITHM);
    }

    public String encrypt(String value) {
        try {
            SecretKeySpec key = getKey();
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] encryptedBytes = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            System.err.println("Encryption error: " + e.getMessage());
            throw new RuntimeException("Error encrypting data", e);
        }
    }

    public String decrypt(String encryptedValue) {
        try {
            SecretKeySpec key = getKey();
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key);
            byte[] decodedBytes = Base64.getDecoder().decode(encryptedValue);
            return new String(cipher.doFinal(decodedBytes), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting data", e);
        }
    }
}