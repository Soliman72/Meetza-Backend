exports.createVideoDuration = async (duration) => {
    return Math.max(0, parseInt(duration, 10) || 0);
}
