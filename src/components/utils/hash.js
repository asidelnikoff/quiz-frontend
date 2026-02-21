import CryptoJS from "crypto-js";

export const hashSHA256 = (str) => CryptoJS.SHA256(str).toString();