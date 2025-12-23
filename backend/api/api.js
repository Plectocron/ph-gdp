import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const PORT = 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const url = "https://en.wikipedia.org/wiki/List_of_regions_of_the_Philippines_by_GDP";

async function getHTML(url) {
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  return data;
}

function getGdpData($) {
  const gdpData = {};
  const gdpTable = $("table.wikitable.sortable").eq(0);

  gdpTable.find("tbody tr").each((i, row) => {
    const rank = $(row).find("td").eq(0).text().trim();
    const regionName = $(row).find("td").eq(1).text().trim();
    const gdpNominal = (Number($(row).find("td").eq(3).text().replace(/[\n,]/g,''))*1000000).toString(); // in USD
    const gdpPPP = (Number($(row).find("td").eq(4).text().replace(/[\n,]/g,''))*1000000).toString();  // in USD
    const gdpPercent = $(row).find("td").eq(5).text().trim();

    gdpData[regionName] = {
      regionName: regionName,
      rank: rank,
      gdpNominal: gdpNominal,
      gdpPPP: gdpPPP,
      gdpPercent: gdpPercent
    };
  });

  return gdpData;
}

function getGdpPerCapitaData($) {
  const gdpPerCapitaData = {};
  const gdpPerCapitaTable = $("table.wikitable.sortable").eq(1);

  gdpPerCapitaTable.find("tbody tr").each((i, row) => {
    const rank = $(row).find("td").eq(0).text().trim();

    if (!rank) return;

    const regionName = $(row).find("td").eq(1).text().trim();
    const gdpNominal = (Number($(row).find("td").eq(3).text().replace(/[\n,]/g,''))*1000000).toString();  // in USD
    const gdpPPP = (Number($(row).find("td").eq(4).text().replace(/[\n,]/g,''))*1000000).toString();  // in USD
    const percentOfAvg = $(row).find("td").eq(5).text().trim();

    gdpPerCapitaData[regionName] = {
      regionName: regionName,
      rank: rank,
      gdpNominal: gdpNominal,
      gdpPPP: gdpPPP,
      percentOfAvg: percentOfAvg
    };
  });

  return gdpPerCapitaData;
}

let $ = null;

getHTML(url).then((res) => {
  $ = cheerio.load(res);
});

app.get("/gdp-per-capita/region", async(req, res) => {
  res.json(getGdpPerCapitaData($));
});

app.get("/gdp/region", async(req, res) => {
  res.json(getGdpData($));
});

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}.`);
});