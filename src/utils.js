export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(num, min, max){
    return Math.min(Math.max(num, min), max);
}
