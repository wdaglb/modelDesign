package io.github.modelDesign.thirdparty.gitlab.service;

import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.thirdparty.gitlab.configuration.GitlabProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * GitLab Token 加密服务。
 */
@Service
@RequiredArgsConstructor
public class GitlabTokenCipherService {
    /**
     * AES-GCM 初始化向量长度。
     */
    private static final int IV_LENGTH = 12;

    /**
     * GCM 认证标签位数。
     */
    private static final int GCM_TAG_LENGTH = 128;

    /**
     * 随机数生成器。
     */
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * GitLab 配置。
     */
    private final GitlabProperties gitlabProperties;

    /**
     * 加密 GitLab Token。
     *
     * @param plainToken 明文 Token
     * @return Base64 编码密文
     */
    public String encrypt(String plainToken) {
        if (!StringUtils.hasText(plainToken)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "GitLab Token 不能为空");
        }
        byte[] iv = new byte[IV_LENGTH];
        secureRandom.nextBytes(iv);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(plainToken.getBytes(StandardCharsets.UTF_8));
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + encrypted.length);
            buffer.put(iv);
            buffer.put(encrypted);
            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (GeneralSecurityException exception) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "GitLab Token 加密失败");
        }
    }

    /**
     * 解密 GitLab Token。
     *
     * @param cipherText Base64 编码密文
     * @return 明文 Token
     */
    public String decrypt(String cipherText) {
        if (!StringUtils.hasText(cipherText)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "GitLab Token 未配置");
        }
        try {
            byte[] allBytes = Base64.getDecoder().decode(cipherText);
            if (allBytes.length <= IV_LENGTH) {
                throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "GitLab Token 密文格式错误");
            }
            ByteBuffer buffer = ByteBuffer.wrap(allBytes);
            byte[] iv = new byte[IV_LENGTH];
            buffer.get(iv);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "GitLab Token 密文格式错误");
        } catch (GeneralSecurityException exception) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "GitLab Token 解密失败");
        }
    }

    /**
     * 对配置主密钥做 SHA-256 派生，保证 AES key 长度稳定。
     *
     * @return AES SecretKeySpec
     */
    private SecretKeySpec secretKey() {
        String secretKey = gitlabProperties.getTokenSecretKey();
        if (!StringUtils.hasText(secretKey) || secretKey.length() < 16) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "GitLab Token 加密主密钥配置错误");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(secretKey.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, "AES");
        } catch (GeneralSecurityException exception) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR.value(), "GitLab Token 加密主密钥初始化失败");
        }
    }
}
