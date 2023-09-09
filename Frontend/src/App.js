import React, { useState } from "react";
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
    market: "",
    num_homes: "",
    uipt: "",
    region_id: "",
  });
  const [processing, setProcessing] = useState(false);
  const [downloadLinks, setDownloadLinks] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  function convertToCSV(objArray) {
    const array =
      typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
    let str = "";

    // Ordered keys for the internal data
    const keys = [
      "STATUS",
      "PRICE",
      "ADJUSTED PRICE",
      "SQUARE FEET",
      "$/SQUARE FEET",
      "ADJUSTED $/SQUARE FEET",
      "BEDS",
      "BATHS",
      "ADDRESS",
      "PERCENTAGE",
      "URL",
    ];

    // Corresponding headers for the CSV output
    const csvHeaders = [
      "STATUS",
      "PRICE",
      "ADJUSTED PRICE",
      "SQUARE FEET",
      "$/SQUARE FEET",
      "ADJUSTED $/SQUARE FEET",
      "BEDS",
      "BATHS",
      "ADDRESS",
      "% BELOW THE MARKET VALUE",
      "URL",
    ];

    str += csvHeaders.join(",") + "\r\n";

    for (let i = 0; i < array.length; i++) {
      let line = "";
      for (let key of keys) {
        if (line !== "") line += ",";
        // Wrap field in quotes and escape inner quotes
        line +=
          '"' + (array[i][key] || "").toString().replace(/"/g, '""') + '"';
      }
      str += line + "\r\n";
    }
    return str;
  }

  function downloadCSV(tableData) {
    const csv = convertToCSV(tableData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "data.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const extractAddressAndPercentage = (addressStr) => {
    console.log("Processing addressStr: ", addressStr);

    const addressMatch = addressStr.match(
      /(.+?)\s*\.\s*\.\s*\.\s*(.+) below market value/
    );

    if (addressMatch && addressMatch[1] && addressMatch[2]) {
      return {
        address: addressMatch[1].trim(),
        percentage: addressMatch[2].trim(),
      };
    }
    return { address: addressStr, percentage: "" };
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    // Call the Flask backend here using fetch
    try {
      const response = await fetch("https://po4w9kv2x0.execute-api.ap-south-1.amazonaws.com/process-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      setProcessing(false);
      setDownloadLinks({
        word: result.word_path,
        pdf: result.pdf_path,
      });
      // Process table data
      const processedTableData = result.table_data.map((row) => {
        const { address, percentage } = extractAddressAndPercentage(
          row.ADDRESS
        );
        return {
          ...row,
          ADDRESS: address,
          PERCENTAGE: percentage,
        };
      });
      setTableData(processedTableData);
    } catch (error) {
      console.error("There was an error:", error);
      setProcessing(false);
    }
  };

  const handleSort = (column) => {
    // Toggle sort order if column is already being sorted, otherwise default to ascending
    const order = column === sortBy && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortOrder(order);

    const sortedData = [...tableData].sort((a, b) => {
      if (a[column] < b[column]) return order === "asc" ? -1 : 1;
      if (a[column] > b[column]) return order === "asc" ? 1 : -1;
      return 0;
    });

    setTableData(sortedData);
  };

  return (
    <div className="App">
      <h1 className="main-title">Undervalued Property Finder</h1>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          name="num_homes"
          value={formData.num_homes}
          onChange={handleChange}
          placeholder="Num Homes"
        />
        <select
          name="uipt"
          value={formData.uipt}
          onChange={handleChange}
          style={{ color: formData.uipt ? "#000" : "#888" }}
        >
          <option value="">Select Property Type</option>
          <option value="1">House</option>
          <option value="2">Condo</option>
          <option value="3">Townhouse</option>
          <option value="4">Multi-family</option>
          <option value="5">Land</option>
          <option value="6">Other</option>
        </select>
        <input
          name="region_id"
          value={formData.region_id}
          onChange={handleChange}
          placeholder="Region ID"
        />
        <button type="submit" className="button-83">
          Search
        </button>
      </form>

      {processing && <div className="lds-dual-ring"></div>}

      {downloadLinks && (
        <div className="download-section">
          <a
            href={downloadLinks.word}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="btn-download btn1"
          >
            <span>Download</span>
            <span>WORD</span>
          </a>
          <a
            href={downloadLinks.pdf}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="btn-download btn2"
          >
            <span>Download</span>
            <span>PDF</span>
          </a>
          <button
            onClick={() => downloadCSV(tableData)}
            className="btn-download btn3"
          >
            <span>Download</span>
            <span>CSV</span>
          </button>
        </div>
      )}

      {tableData && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("STATUS")}>STATUS</th>
                <th onClick={() => handleSort("PRICE")}>PRICE</th>
                <th onClick={() => handleSort("ADJUSTED PRICE")}>
                  ADJUSTED PRICE
                </th>
                <th onClick={() => handleSort("SQUARE FEET")}>SQUARE FEET</th>
                <th onClick={() => handleSort("$/SQUARE FEET")}>
                  $/SQUARE FEET
                </th>
                <th onClick={() => handleSort("ADJUSTED $/SQUARE FEET")}>
                  ADJUSTED $/SQUARE FEET
                </th>
                <th onClick={() => handleSort("BEDS")}>BEDS</th>
                <th onClick={() => handleSort("BATHS")}>BATHS</th>
                <th onClick={() => handleSort("ADDRESS")}>ADDRESS</th>
                <th>% BELOW THE MARKET VALUE</th>
                <th onClick={() => handleSort("URL")}>URL</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index}>
                  <td>{row.STATUS}</td>
                  <td>{row.PRICE}</td>
                  <td>{row["ADJUSTED PRICE"]}</td>
                  <td>{row["SQUARE FEET"]}</td>
                  <td>{row["$/SQUARE FEET"]}</td>
                  <td>{row["ADJUSTED $/SQUARE FEET"]}</td>
                  <td>{row.BEDS}</td>
                  <td>{row.BATHS}</td>
                  <td>{row.ADDRESS}</td>
                  <td>{row.PERCENTAGE}</td>
                  <td>
                    <a href={row.URL} target="_blank" rel="noopener noreferrer">
                      Link
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
