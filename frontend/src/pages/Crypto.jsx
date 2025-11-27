import React, { useState, useEffect, useRef } from "react";
import "./Crypto.css";

/*
  Upgraded Crypto Dashboard - Style A (Clean & Professional)
  Features:
  - Top summary cards (global market cap, BTC/ETH dominance, 24h volume)
  - Search bar and pagination (Top 10/50)
  - Improved Top table with sparkline (uses sparkline_in_7d field)
  - Portfolio calculator (multi coin, saved to localStorage)
  - Heatmap coloring for 24h change
  - Alerts (browser notifications + localStorage)
  - Responsive layout and attractive CSS in Crypto.css
  Notes: Data from CoinGecko
*/

const COINGECKO_MARKETS = (per_page=10, page=1) =>
  `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${per_page}&page=${page}&sparkline=true&price_change_percentage=24h`;

const COINGECKO_GLOBAL = "https://api.coingecko.com/api/v3/global";

const STORAGE_PORTFOLIO = "crypto_portfolio_v2";
const STORAGE_ALERTS = "crypto_alerts_v1";

const formatCurrency = (value, fiat) => {
  if (value === null || value === undefined || isNaN(value)) return "-";
  const locale = fiat === "INR" ? "en-IN" : "en-US";
  const currency = fiat === "INR" ? "INR" : "USD";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
};

// Simple inline sparkline generator using sparkline array from CoinGecko
const Sparkline = ({ data = [], color = "#2b7cff", width = 120, height = 30 }) => {
  if (!data || data.length === 0) return <svg width={width} height={height}></svg>;
  // normalize data
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const d = "M" + points.join(" L ");
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Crypto = () => {
  const [coins, setCoins] = useState([]);
  const [global, setGlobal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [fiat, setFiat] = useState("USD");
  const [portfolio, setPortfolio] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const pollingRef = useRef(null);
  const rateRef = useRef(1); // USD->INR rate

  useEffect(() => {
    // load saved portfolio and alerts
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_PORTFOLIO) || "[]");
      setPortfolio(p);
      const a = JSON.parse(localStorage.getItem(STORAGE_ALERTS) || "[]");
      setAlerts(a);
    } catch (e) {
      console.warn("load error", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_PORTFOLIO, JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ALERTS, JSON.stringify(alerts));
  }, [alerts]);

  // fetch exchange rate USD->INR
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const r = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=INR");
        const j = await r.json();
        if (j && j.rates && j.rates.INR) rateRef.current = j.rates.INR;
      } catch (e) {
        rateRef.current = 82; // fallback
      }
    };
    fetchRate();
  }, []);

  const convert = (usd) => (fiat === "USD" ? usd : usd * rateRef.current);

  // fetch coins and global
  const fetchAll = async () => {
    try {
      setLoading(true);
      const marketsRes = await fetch(COINGECKO_MARKETS(perPage, page));
      const markets = await marketsRes.json();
      setCoins(markets || []);
      const gres = await fetch(COINGECKO_GLOBAL);
      const gjson = await gres.json();
      setGlobal(gjson.data || null);
      setLoading(false);
    } catch (e) {
      console.error("fetchAll error", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    pollingRef.current = setInterval(fetchAll, 10000);
    return () => clearInterval(pollingRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, page]);

  // Apply search filter
  const filtered = coins.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
  });

  // Portfolio utilities
  const addToPortfolio = (coin) => {
    setPortfolio((prev) => {
      if (prev.find((p) => p.id === coin.id)) return prev;
      return [...prev, { id: coin.id, symbol: coin.symbol, name: coin.name, qty: 0, price_usd: coin.current_price, image: coin.image }];
    });
  };
  const removeFromPortfolio = (id) => setPortfolio((p) => p.filter((x) => x.id !== id));
  const updateQty = (id, qty) => {
    setPortfolio((p) => p.map((it) => (it.id === id ? { ...it, qty: Number(qty) } : it)));
  };

  // Alerts utilities
  const addAlert = (id, target, above=true) => {
    const a = { id, target: Number(target), above: !!above, createdAt: Date.now() };
    setAlerts((prev) => [...prev, a]);
    // ask notification permission
    if (("Notification" in window) && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };
  const removeAlert = (idx) => setAlerts((a) => a.filter((_, i) => i !== idx));

  // Check alerts each fetch
  useEffect(() => {
    if (!coins || coins.length === 0) return;
    alerts.forEach((alert) => {
      const coin = coins.find((c) => c.id === alert.id);
      if (!coin) return;
      const price = coin.current_price;
      const triggered = alert.above ? price >= alert.target : price <= alert.target;
      if (triggered) {
        // browser notification
        if (("Notification" in window) && Notification.permission === "granted") {
          new Notification(`${coin.name} price alert`, { body: `${coin.symbol.toUpperCase()} is ${formatCurrency(convert(price), fiat)} (target ${formatCurrency(convert(alert.target), fiat)})` });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins]);

  const portfolioWithLatest = portfolio.map((p) => {
    const coin = coins.find((c) => c.id === p.id) || {};
    const price = coin.current_price || p.price_usd || 0;
    const total = (Number(p.qty) || 0) * convert(price);
    return { ...p, price, total, image: coin.image || p.image };
  });
  const portfolioTotal = portfolioWithLatest.reduce((s, x) => s + (x.total || 0), 0);

  return (
    <div className="crypto-wrap">
      <header className="crypto-header">
        <h1>Crypto Dashboard</h1>
        <div className="search-and-actions">
          <input
            placeholder="Search coin (name or symbol)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="selects">
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
              <option value={10}>Top 10</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
            </select>
            <select value={fiat} onChange={(e) => setFiat(e.target.value)}>
              <option value="USD">USD</option>
              <option value="INR">INR</option>
            </select>
          </div>
        </div>
      </header>

      <section className="summary-cards">
        <div className="card">
          <div className="card-title">Total Market Cap</div>
          <div className="card-value">{global ? formatCurrency(convert(global.total_market_cap.usd), fiat) : "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">24h Volume</div>
          <div className="card-value">{global ? formatCurrency(convert(global.total_volume.usd), fiat) : "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">BTC Dominance</div>
          <div className="card-value">{global ? `${global.market_cap_percentage.btc.toFixed(2)}%` : "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">Active Cryptos</div>
          <div className="card-value">{global ? global.active_cryptocurrencies : "—"}</div>
        </div>
      </section>

      <main className="main-grid">
        <div className="left-panel">
          <div className="panel-header">
            <h3>Top Cryptocurrencies</h3>
            <div className="small-note">Prices update every 10s — Data: CoinGecko</div>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div className="loader">Loading...</div>
            ) : (
              <table className="coins-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Coin</th>
                    <th>Price</th>
                    <th>24h</th>
                    <th>Market Cap</th>
                    <th>Chart</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => (
                    <tr key={c.id} className={c.price_change_percentage_24h > 0 ? "up" : "down"}>
                      <td>{idx + 1 + (page-1)*perPage}</td>
                      <td className="coin-cell">
                        <img src={c.image} alt={c.symbol} />
                        <div>
                          <div className="coin-name">{c.name}</div>
                          <div className="coin-symbol">{c.symbol.toUpperCase()}</div>
                        </div>
                      </td>
                      <td>{formatCurrency(convert(c.current_price), fiat)}</td>
                      <td className="change-cell">
                        <span>{c.price_change_percentage_24h ? c.price_change_percentage_24h.toFixed(2) : "0.00"}%</span>
                      </td>
                      <td>{formatCurrency(convert(c.market_cap), fiat)}</td>
                      <td><Sparkline data={(c.sparkline_in_7d && c.sparkline_in_7d.price) ? c.sparkline_in_7d.price.slice(-30) : []} /></td>
                      <td><button onClick={() => addToPortfolio(c)}>Add</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="alerts-panel">
            <h4>Price Alerts</h4>
            <div className="alert-form">
              <select id="alert-coin">
                <option value="">Choose coin</option>
                {coins.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>)}
              </select>
              <input id="alert-price" placeholder="Target price (USD)" type="number" />
              <select id="alert-dir">
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
              <button onClick={() => {
                const sel = document.getElementById("alert-coin").value;
                const price = document.getElementById("alert-price").value;
                const dir = document.getElementById("alert-dir").value;
                if (!sel || !price) return alert("Select coin and target price");
                addAlert(sel, price, dir==="above");
                alert("Alert saved");
              }}>Set Alert</button>
            </div>
            <div className="alerts-list">
              {alerts.length===0 ? <div className="muted">No alerts set</div> : alerts.map((a, i) => {
                const coin = coins.find((c)=>c.id===a.id);
                return (
                  <div className="alert-item" key={i}>
                    <div>{coin ? coin.name : a.id} {a.above ? "≥" : "≤"} {formatCurrency(convert(a.target), fiat)}</div>
                    <button onClick={()=>removeAlert(i)}>Remove</button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        <aside className="right-panel">
          <div className="panel-header">
            <h3>Your Portfolio</h3>
            <div className="small-note">Saved in your browser</div>
          </div>

          <div className="portfolio-list">
            {portfolioWithLatest.length===0 ? <div className="muted padded">Portfolio empty — add coins from the table</div> : portfolioWithLatest.map((p) => (
              <div className="portfolio-item" key={p.id}>
                <div className="pi-left">
                  <img src={p.image} alt={p.symbol} />
                  <div>
                    <div className="coin-name">{p.name}</div>
                    <div className="coin-symbol">{p.symbol.toUpperCase()}</div>
                  </div>
                </div>
                <div className="pi-mid">
                  <input type="number" min="0" step="any" value={p.qty} onChange={(e)=>updateQty(p.id, e.target.value)} />
                </div>
                <div className="pi-right">
                  <div className="small-muted">{formatCurrency(p.price, fiat)}</div>
                  <div className="total">{formatCurrency(p.total, fiat)}</div>
                  <button className="remove" onClick={()=>removeFromPortfolio(p.id)}>Remove</button>
                </div>
              </div>
            ))}

            <div className="portfolio-total">
              <div>Total Value</div>
              <div className="big">{formatCurrency(portfolioTotal, fiat)}</div>
            </div>
          </div>

          <div className="panel-footer muted">
            Tip: Use the search and per-page selector for more coins. Notifications require browser permission.
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Crypto;