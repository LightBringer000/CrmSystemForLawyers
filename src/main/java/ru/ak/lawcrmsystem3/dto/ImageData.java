package ru.ak.lawcrmsystem3.dto;


public class ImageData {

    private byte[] data;
    private String type;

    public ImageData(byte[] data, String type) {
        this.data = data;
        this.type = type;
    }

    // Getters
    public byte[] getData() {
        return data;
    }

    public String getType() {
        return type;
    }

}
