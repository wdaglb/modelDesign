package io.github.modelDesign.system.service;

/**
 * 文件二进制内容。
 *
 * @param bytes       文件字节
 * @param contentType 内容类型
 * @param filename    文件名
 */
public record SystemFileBinaryContent(byte[] bytes, String contentType, String filename) {
}
