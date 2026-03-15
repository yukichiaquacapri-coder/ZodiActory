import swisseph from 'swisseph';

export default async function handler(req, res) {
    const { date, time, lat, lng } = req.query;

    try {
        const [year, month, day] = date.split('-').map(Number);
        const [hour, min] = time.split(':').map(Number);
        
        // ユリウス日を計算（世界時基準）
        const ut = hour + min / 60;
        const jd = swisseph.swe_julday(year, month, day, ut, swisseph.SE_GREG_CAL);

        const signs = ["牡羊座", "牡牛座", "双子座", "蟹座", "獅子座", "乙女座", "天秤座", "蠍座", "射手座", "山羊座", "水瓶座", "魚座"];

        const getPos = (body) => {
            const res = swisseph.swe_calc_ut(jd, body, swisseph.SEFLG_SPEED);
            const long = res.longitude;
            const signIdx = Math.floor(long / 30);
            const degree = (long % 30).toFixed(2);
            return `${signs[signIdx]} ${degree}°`;
        };

        // ハウス（ASC）の計算
        const houses = swisseph.swe_houses(jd, parseFloat(lat), parseFloat(lng), 'P');
        const ascLong = houses.ascendant;
        const ascPos = `${signs[Math.floor(ascLong / 30)]} ${(ascLong % 30).toFixed(2)}°`;

        res.status(200).json({
            sunPos: getPos(swisseph.SE_SUN),
            moonPos: getPos(swisseph.SE_MOON),
            ascPos: ascPos
        });
    } catch (e) {
        res.status(500).json({ error: "精密計算エラーが発生しました" });
    }
}
