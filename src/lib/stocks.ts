export interface StockEntry {
  name: string;
  ticker: string;
  sector: string;
}

export const NSE_STOCKS: StockEntry[] = [
  // Nifty 50 & Large Caps
  { name: "Reliance Industries", ticker: "RELIANCE.NS", sector: "Oil & Gas" },
  { name: "Tata Consultancy Services", ticker: "TCS.NS", sector: "IT" },
  { name: "HDFC Bank", ticker: "HDFCBANK.NS", sector: "Banking" },
  { name: "Infosys", ticker: "INFY.NS", sector: "IT" },
  { name: "ICICI Bank", ticker: "ICICIBANK.NS", sector: "Banking" },
  { name: "Hindustan Unilever", ticker: "HINDUNILVR.NS", sector: "FMCG" },
  { name: "ITC", ticker: "ITC.NS", sector: "FMCG" },
  { name: "State Bank of India", ticker: "SBIN.NS", sector: "Banking" },
  { name: "Bharti Airtel", ticker: "BHARTIARTL.NS", sector: "Telecom" },
  { name: "Kotak Mahindra Bank", ticker: "KOTAKBANK.NS", sector: "Banking" },
  { name: "Larsen & Toubro", ticker: "LT.NS", sector: "Infrastructure" },
  { name: "Axis Bank", ticker: "AXISBANK.NS", sector: "Banking" },
  { name: "Asian Paints", ticker: "ASIANPAINT.NS", sector: "Paints" },
  { name: "Maruti Suzuki", ticker: "MARUTI.NS", sector: "Auto" },
  { name: "Titan Company", ticker: "TITAN.NS", sector: "Consumer" },
  { name: "Bajaj Finance", ticker: "BAJFINANCE.NS", sector: "NBFC" },
  { name: "Sun Pharma", ticker: "SUNPHARMA.NS", sector: "Pharma" },
  { name: "Wipro", ticker: "WIPRO.NS", sector: "IT" },
  { name: "HCL Technologies", ticker: "HCLTECH.NS", sector: "IT" },
  { name: "Tata Motors", ticker: "TATAMOTORS.NS", sector: "Auto" },
  { name: "UltraTech Cement", ticker: "ULTRACEMCO.NS", sector: "Cement" },
  { name: "Nestle India", ticker: "NESTLEIND.NS", sector: "FMCG" },
  { name: "Power Grid Corp", ticker: "POWERGRID.NS", sector: "Power" },
  { name: "NTPC", ticker: "NTPC.NS", sector: "Power" },
  { name: "Mahindra & Mahindra", ticker: "M&M.NS", sector: "Auto" },
  { name: "Bajaj Finserv", ticker: "BAJAJFINSV.NS", sector: "NBFC" },
  { name: "Tech Mahindra", ticker: "TECHM.NS", sector: "IT" },
  { name: "Tata Steel", ticker: "TATASTEEL.NS", sector: "Metals" },
  { name: "IndusInd Bank", ticker: "INDUSINDBK.NS", sector: "Banking" },
  { name: "Adani Enterprises", ticker: "ADANIENT.NS", sector: "Conglomerate" },
  { name: "Adani Ports", ticker: "ADANIPORTS.NS", sector: "Ports" },
  { name: "Adani Green Energy", ticker: "ADANIGREEN.NS", sector: "Renewable Energy" },
  { name: "Adani Power", ticker: "ADANIPOWER.NS", sector: "Power" },
  { name: "Grasim Industries", ticker: "GRASIM.NS", sector: "Cement" },
  { name: "Cipla", ticker: "CIPLA.NS", sector: "Pharma" },
  { name: "Dr Reddy's Labs", ticker: "DRREDDY.NS", sector: "Pharma" },
  { name: "Coal India", ticker: "COALINDIA.NS", sector: "Mining" },
  { name: "Eicher Motors", ticker: "EICHERMOT.NS", sector: "Auto" },
  { name: "Britannia Industries", ticker: "BRITANNIA.NS", sector: "FMCG" },
  { name: "Divi's Labs", ticker: "DIVISLAB.NS", sector: "Pharma" },
  { name: "Bajaj Auto", ticker: "BAJAJ-AUTO.NS", sector: "Auto" },
  { name: "Hero MotoCorp", ticker: "HEROMOTOCO.NS", sector: "Auto" },
  { name: "JSW Steel", ticker: "JSWSTEEL.NS", sector: "Metals" },
  { name: "SBI Life Insurance", ticker: "SBILIFE.NS", sector: "Insurance" },
  { name: "HDFC Life Insurance", ticker: "HDFCLIFE.NS", sector: "Insurance" },
  { name: "Apollo Hospitals", ticker: "APOLLOHOSP.NS", sector: "Healthcare" },
  { name: "Tata Consumer Products", ticker: "TATACONSUM.NS", sector: "FMCG" },
  { name: "Hindalco Industries", ticker: "HINDALCO.NS", sector: "Metals" },
  { name: "BPCL", ticker: "BPCL.NS", sector: "Oil & Gas" },
  { name: "Oil & Natural Gas Corp", ticker: "ONGC.NS", sector: "Oil & Gas" },

  // Mid & Small Caps - Popular
  { name: "Zomato", ticker: "ZOMATO.NS", sector: "Tech" },
  { name: "Paytm (One97)", ticker: "PAYTM.NS", sector: "Fintech" },
  { name: "Nykaa (FSN E-Commerce)", ticker: "NYKAA.NS", sector: "E-Commerce" },
  { name: "PB Fintech (Policybazaar)", ticker: "POLICYBZR.NS", sector: "Fintech" },
  { name: "Delhivery", ticker: "DELHIVERY.NS", sector: "Logistics" },
  { name: "Vedanta", ticker: "VEDL.NS", sector: "Mining" },
  { name: "Tata Power", ticker: "TATAPOWER.NS", sector: "Power" },
  { name: "Tata Elxsi", ticker: "TATAELXSI.NS", sector: "IT" },
  { name: "Pidilite Industries", ticker: "PIDILITIND.NS", sector: "Chemicals" },
  { name: "Havells India", ticker: "HAVELLS.NS", sector: "Electricals" },
  { name: "Godrej Consumer", ticker: "GODREJCP.NS", sector: "FMCG" },
  { name: "Dabur India", ticker: "DABUR.NS", sector: "FMCG" },
  { name: "Colgate Palmolive", ticker: "COLPAL.NS", sector: "FMCG" },
  { name: "Marico", ticker: "MARICO.NS", sector: "FMCG" },
  { name: "Berger Paints", ticker: "BERGEPAINT.NS", sector: "Paints" },
  { name: "Siemens", ticker: "SIEMENS.NS", sector: "Capital Goods" },
  { name: "ABB India", ticker: "ABB.NS", sector: "Capital Goods" },
  { name: "Bharat Electronics", ticker: "BEL.NS", sector: "Defense" },
  { name: "HAL (Hindustan Aeronautics)", ticker: "HAL.NS", sector: "Defense" },
  { name: "Indian Railway Catering", ticker: "IRCTC.NS", sector: "Travel" },
  { name: "Dixon Technologies", ticker: "DIXON.NS", sector: "Electronics" },
  { name: "Varun Beverages", ticker: "VBL.NS", sector: "Beverages" },
  { name: "Trent", ticker: "TRENT.NS", sector: "Retail" },
  { name: "Avenue Supermarts (DMart)", ticker: "DMART.NS", sector: "Retail" },
  { name: "Page Industries", ticker: "PAGEIND.NS", sector: "Textiles" },
  { name: "Muthoot Finance", ticker: "MUTHOOTFIN.NS", sector: "NBFC" },
  { name: "Cholamandalam Investment", ticker: "CHOLAFIN.NS", sector: "NBFC" },
  { name: "Shriram Finance", ticker: "SHRIRAMFIN.NS", sector: "NBFC" },
  { name: "ICICI Prudential Life", ticker: "ICICIPRULI.NS", sector: "Insurance" },
  { name: "Max Healthcare", ticker: "MAXHEALTH.NS", sector: "Healthcare" },
  { name: "Fortis Healthcare", ticker: "FORTIS.NS", sector: "Healthcare" },
  { name: "Laurus Labs", ticker: "LAURUSLABS.NS", sector: "Pharma" },
  { name: "Biocon", ticker: "BIOCON.NS", sector: "Pharma" },
  { name: "Aurobindo Pharma", ticker: "AUROPHARMA.NS", sector: "Pharma" },
  { name: "Torrent Pharma", ticker: "TORNTPHARM.NS", sector: "Pharma" },
  { name: "Indian Oil Corp", ticker: "IOC.NS", sector: "Oil & Gas" },
  { name: "Hindustan Petroleum", ticker: "HINDPETRO.NS", sector: "Oil & Gas" },
  { name: "Bharat Petroleum", ticker: "BPCL.NS", sector: "Oil & Gas" },
  { name: "JSW Energy", ticker: "JSWENERGY.NS", sector: "Power" },
  { name: "Adani Total Gas", ticker: "ATGL.NS", sector: "Gas" },
  { name: "Indus Towers", ticker: "INDUSTOWER.NS", sector: "Telecom" },
  { name: "Vodafone Idea", ticker: "IDEA.NS", sector: "Telecom" },
  { name: "Bank of Baroda", ticker: "BANKBARODA.NS", sector: "Banking" },
  { name: "Punjab National Bank", ticker: "PNB.NS", sector: "Banking" },
  { name: "Canara Bank", ticker: "CANBK.NS", sector: "Banking" },
  { name: "Federal Bank", ticker: "FEDERALBNK.NS", sector: "Banking" },
  { name: "Bandhan Bank", ticker: "BANDHANBNK.NS", sector: "Banking" },
  { name: "IDFC First Bank", ticker: "IDFCFIRSTB.NS", sector: "Banking" },
  { name: "L&T Technology Services", ticker: "LTTS.NS", sector: "IT" },
  { name: "Mphasis", ticker: "MPHASIS.NS", sector: "IT" },
  { name: "Persistent Systems", ticker: "PERSISTENT.NS", sector: "IT" },
  { name: "Coforge", ticker: "COFORGE.NS", sector: "IT" },
  { name: "LTIMindtree", ticker: "LTIM.NS", sector: "IT" },
  { name: "Polycab India", ticker: "POLYCAB.NS", sector: "Electricals" },
  { name: "KEI Industries", ticker: "KEI.NS", sector: "Electricals" },
  { name: "Crompton Greaves", ticker: "CROMPTON.NS", sector: "Electricals" },
  { name: "Voltas", ticker: "VOLTAS.NS", sector: "Consumer Durables" },
  { name: "Whirlpool India", ticker: "WHIRLPOOL.NS", sector: "Consumer Durables" },
  { name: "Blue Star", ticker: "BLUESTARCO.NS", sector: "Consumer Durables" },
  { name: "Ambuja Cements", ticker: "AMBUJACEM.NS", sector: "Cement" },
  { name: "Shree Cement", ticker: "SHREECEM.NS", sector: "Cement" },
  { name: "ACC", ticker: "ACC.NS", sector: "Cement" },
  { name: "Dalmia Bharat", ticker: "DALBHARAT.NS", sector: "Cement" },
  { name: "PI Industries", ticker: "PIIND.NS", sector: "Chemicals" },
  { name: "SRF", ticker: "SRF.NS", sector: "Chemicals" },
  { name: "Deepak Nitrite", ticker: "DEEPAKNTR.NS", sector: "Chemicals" },
  { name: "Atul", ticker: "ATUL.NS", sector: "Chemicals" },
  { name: "Container Corp", ticker: "CONCOR.NS", sector: "Logistics" },
  { name: "InterGlobe Aviation (IndiGo)", ticker: "INDIGO.NS", sector: "Aviation" },
  { name: "Jubilant FoodWorks", ticker: "JUBLFOOD.NS", sector: "QSR" },
  { name: "Info Edge (Naukri)", ticker: "NAUKRI.NS", sector: "Tech" },
  { name: "MakeMyTrip", ticker: "MMYT.NS", sector: "Travel" },
  { name: "Mazagon Dock", ticker: "MAZDOCK.NS", sector: "Defense" },
  { name: "Cochin Shipyard", ticker: "COCHINSHIP.NS", sector: "Defense" },
  { name: "Solar Industries", ticker: "SOLARINDS.NS", sector: "Defense" },
  { name: "Data Patterns", ticker: "DATAPATTNS.NS", sector: "Defense" },
  { name: "IRFC", ticker: "IRFC.NS", sector: "Railways" },
  { name: "RVNL", ticker: "RVNL.NS", sector: "Railways" },
  { name: "Suzlon Energy", ticker: "SUZLON.NS", sector: "Renewable Energy" },
  { name: "NHPC", ticker: "NHPC.NS", sector: "Power" },
  { name: "Tata Technologies", ticker: "TATATECH.NS", sector: "IT" },
  { name: "Jio Financial Services", ticker: "JIOFIN.NS", sector: "NBFC" },
  { name: "LIC (Life Insurance Corp)", ticker: "LICI.NS", sector: "Insurance" },
];

export function searchStocks(query: string, limit = 8): StockEntry[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results: { stock: StockEntry; score: number }[] = [];

  for (const stock of NSE_STOCKS) {
    const name = stock.name.toLowerCase();
    const ticker = stock.ticker.toLowerCase().replace(".ns", "");
    const sector = stock.sector.toLowerCase();

    let score = 0;
    if (name === q || ticker === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (ticker.startsWith(q)) score = 75;
    else if (name.includes(q)) score = 50;
    else if (ticker.includes(q)) score = 45;
    else if (sector.includes(q)) score = 20;
    else {
      const words = q.split(/\s+/);
      const matched = words.filter(w => name.includes(w) || ticker.includes(w));
      if (matched.length > 0) score = 10 + matched.length * 10;
    }

    if (score > 0) results.push({ stock, score });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.stock);
}
