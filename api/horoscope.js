import { Origin, Chart } from 'astrology-js';

export default async function handler(req, res) {
    const { date, time, lat, lng } = req.query;
    try {
        const [year, month, day] = date.split('-').map(Number);
        const [hour, minute] = time.split(':').map(Number);

        const origin = new Origin({
            year, month, day, hour, minute,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
        });

        // スイス・エフェメリスのアルゴリズムでチャートを作成
        const chart = new Chart(origin);
        const signs = ["牡羊座", "牡牛座", "双子座", "蟹座", "獅子座", "乙女座", "天秤座", "蠍座", "射手座", "山羊座", "水瓶座", "魚座"];

        const format = (p) => {
            const deg = p.longitudeInSign.toFixed(2
                                                 
            const retro = p.isRetrograde ? " (R)" : "";
            return `${signs[p.sign - 1]} ${deg}°${retro}`;
        };

        res.status(200).json({
            sunPos: format(chart.sun),
            moonPos: format(chart.moon),
            // あなたの逆行している火星もこれで正確に出るはずです
            marsPos: format(chart.mars),
            ascPos: `${signs[chart.ascendant.sign - 1]} ${chart.ascendant.longitudeInSign.toFixed(2)}°`
        });
    } catch (e) {
        res.status(500).json({ error: "精密計算エンジンが起動できませんでした" });
    }
}
