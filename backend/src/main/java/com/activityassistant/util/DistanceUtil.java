package com.activityassistant.util;

/**
 * 距离计算工具类
 *
 * <p>用于计算两个 GPS 坐标之间的距离，用于签到范围验证。
 *
 * <p>使用 Haversine 公式计算球面距离。
 *
 * @author Claude
 * @since 2025-01-08
 */
public class DistanceUtil {

    /**
     * 地球半径（米）
     */
    private static final double EARTH_RADIUS = 6371000;

    /**
     * 计算两个GPS坐标之间的距离（米）
     *
     * <p>使用 Haversine 公式计算球面距离，适用于短距离计算（< 500km）。
     *
     * @param lat1 第一个点的纬度
     * @param lon1 第一个点的经度
     * @param lat2 第二个点的纬度
     * @param lon2 第二个点的经度
     * @return 距离（米）
     */
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // 将角度转换为弧度
        double radLat1 = Math.toRadians(lat1);
        double radLat2 = Math.toRadians(lat2);
        double deltaLat = Math.toRadians(lat2 - lat1);
        double deltaLon = Math.toRadians(lon2 - lon1);

        // Haversine 公式
        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
                + Math.cos(radLat1) * Math.cos(radLat2)
                * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // 返回距离（米）
        return EARTH_RADIUS * c;
    }

    /**
     * 检查是否在指定范围内
     *
     * @param lat1   用户纬度
     * @param lon1   用户经度
     * @param lat2   目标点纬度
     * @param lon2   目标点经度
     * @param radius 允许的范围半径（米）
     * @return 是否在范围内
     */
    public static boolean isWithinRadius(double lat1, double lon1, double lat2, double lon2, double radius) {
        double distance = calculateDistance(lat1, lon1, lat2, lon2);
        return distance <= radius;
    }

    /**
     * 验证经纬度是否合法
     *
     * @param latitude  纬度
     * @param longitude 经度
     * @return 是否合法
     */
    public static boolean isValidCoordinate(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return false;
        }

        // 纬度范围：-90 到 90
        if (latitude < -90 || latitude > 90) {
            return false;
        }

        // 经度范围：-180 到 180
        if (longitude < -180 || longitude > 180) {
            return false;
        }

        return true;
    }

    /**
     * 格式化距离为易读字符串
     *
     * @param distance 距离（米）
     * @return 格式化后的字符串（如 "25米"、"1.2公里"）
     */
    public static String formatDistance(double distance) {
        if (distance < 1000) {
            return String.format("%.0f米", distance);
        } else {
            return String.format("%.1f公里", distance / 1000);
        }
    }
}
