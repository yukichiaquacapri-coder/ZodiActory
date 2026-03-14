import swisheph from 'swisseph';

export default function handler(req, res) {
    const { date, time, lat, lng } = req.query;
    if (!date || !time || !lat || !lng) {
        return res.status(400).json({ error: "Required data missing" });
    }

    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // 1. 世界時(UT)に変換（日本時間なら-9時間。後で動的に調整可能）
    const utHour = hour + (minute / 60) - 9; 
    const julianDay = swisheph.swe_julday(year, month, day, utHour, swisheph.SE_GREG_CAL);

    const signs = ["牡羊座", "牡牛座", "双子座", "蟹座", "獅子座", "乙女座", "天秤座", "蠍座", "射手座", "山羊座", "水瓶座", "魚座"];
    const getSign = (long) => signs[Math.floor(long / 30)] + ` (${(long % 30).toFixed(2)}°)`;

    // 2. 太陽の位置計算
    swisheph.swe_calc_ut(julianDay, swisheph.SE_SUN, swisheph.SEFLG_SPEED, (res_sun) => {
        const sunInfo = getSign(res_sun.longitude);

        // 3. 月の位置計算
        swisheph.swe_calc_ut(julianDay, swisheph.SE_MOON, swisheph.SEFLG_SPEED, (res_moon) => {
            const moonInfo = getSign(res_moon.longitude);

            // 4. ハウスとアセンダントの計算 ('P'はプラシーダス)
            swisheph.swe_houses(julianDay, latitude, longitude, 'P', (res_houses) => {
                const ascInfo = getSign(res_houses.ascendant);

                res.status(200).json({
                    sun: sunInfo,
                    moon: moonInfo,
                    asc: ascInfo
                });
            });
        });
    });
}
