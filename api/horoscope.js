import { Origin, Chart } from 'astrology-js';

export default function handler(req, res) {
    const { date, time, lat, lng } = req.query;
    try {
        const [year, month, day] = date.split('-').map(Number);
        const [hour, minute] = time.split(':').map(Number);
        const origin = new Origin({
            year, month, day, hour, minute,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
        });
        const chart = new Chart(origin);
        const signs = ["牡羊座", "牡牛座", "双子座", "蟹座", "獅子座", "乙女座", "天秤座", "蠍座", "射手座", "山羊座", "水瓶座", "魚座"];
        const format = (obj) => `${signs[obj.sign - 1]} ${obj.longitudeInSign.toFixed(2)}°`;

        // sunPos, moonPos, ascPos という名前で送り出します
        res.status(200).json({
            sunPos: format(chart.sun),
            moonPos: format(chart.moon),
            ascPos: signs[chart.ascendant.sign - 1] + " " + chart.ascendant.longitudeInSign.toFixed(2) + "°"
        });
    } catch (e) {
        res.status(500).json({ error: "Calculation failed" });
    }
}
