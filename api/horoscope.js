import { Origin, Chart } from 'astrology-js';

export default function handler(req, res) {
    const { date, time, lat, lng } = req.query;
    if (!date || !time || !lat || !lng) {
        return res.status(400).json({ error: "Required data missing" });
    }

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

        const formatPos = (obj) => {
            const s = signs[obj.sign - 1];
            return `${s} ${obj.longitudeInSign.toFixed(2)}°`;
        };

        res.status(200).json({
            sun: formatPos(chart.sun),
            moon: formatPos(chart.moon),
            asc: signs[chart.ascendant.sign - 1] + ` ${chart.ascendant.longitudeInSign.toFixed(2)}°`
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
