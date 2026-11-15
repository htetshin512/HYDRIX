
 

(() => {
  "use strict";

  
  
  

  const towns = [
    {
      id: "monywa",
      name: "Monywa",
      region: "sagaing",
      lat: 22.1085,
      lon: 95.1358,
      focus: "Water access and agriculture",
      description:
        "A reference town near the Chindwin River in lower Sagaing. Explore the relationship between seasonal rainfall and community water needs."
    },
    {
      id: "shwebo",
      name: "Shwebo",
      region: "sagaing",
      lat: 22.5670,
      lon: 95.6980,
      focus: "Rain-fed farming and seasonal water",
      description:
        "A Sagaing-region reference location where seasonal weather patterns and agricultural water planning can be explored."
    },
    {
      id: "salingyi",
      name: "Salingyi",
      region: "sagaing",
      lat: 21.97182,
      lon: 95.08036,
      focus: "Local water availability",
      description:
        "A reference town in lower Sagaing used to explore rainfall patterns and the importance of reliable water sources."
    },
    {
      id: "myingyan",
      name: "Myingyan",
      region: "mandalay",
      lat: 21.460024,
      lon: 95.388403,
      focus: "Seasonal rainfall and agriculture",
      description:
        "A town in the Central Dry Zone. Historical rainfall patterns help explain why careful water management matters for local agriculture and households."
    },
    {
      id: "nyaungu",
      name: "Nyaung-U",
      region: "mandalay",
      lat: 21.200557,
      lon: 94.908266,
      focus: "Rainfall seasonality",
      description:
        "A Central Myanmar reference location where the contrast between wetter and drier months can be explored with historical rainfall estimates."
    },
    {
      id: "kyaukpadaung",
      name: "Kyaukpadaung",
      region: "mandalay",
      lat: 20.841582,
      lon: 95.126701,
      focus: "Changing local conditions",
      description:
        "A Mandalay-region reference location for observing how historical precipitation patterns vary across the broader Dry Zone."
    },
    {
      id: "pakokku",
      name: "Pakokku",
      region: "magway",
      lat: 21.334886,
      lon: 95.084381,
      focus: "Household and farm water",
      description:
        "A town in northern Magway Region used to explore seasonal rainfall and the importance of water conservation."
    },
    {
      id: "chauk",
      name: "Chauk",
      region: "magway",
      lat: 20.899214,
      lon: 94.817835,
      focus: "Dry-season preparedness",
      description:
        "A Magway-region reference town for examining historical rainfall seasonality and preparation during drier months."
    },
    {
      id: "magway",
      name: "Magway",
      region: "magway",
      lat: 20.149557,
      lon: 94.932464,
      focus: "Community water planning",
      description:
        "A regional centre in the Central Dry Zone. Explore monthly historical rainfall estimates for its approximate town centre."
    }
  ];

  const regionNames = {
    sagaing: "Sagaing Region",
    mandalay: "Mandalay Region",
    magway: "Magway Region"
  };

  
  

  const colors = {
    sagaing: "#648FAF",
    mandalay: "#AC8B59",
    magway: "#73978E"
  };

  const months = [
    "JAN", "FEB", "MAR", "APR",
    "MAY", "JUN", "JUL", "AUG",
    "SEP", "OCT", "NOV", "DEC"
  ];

  const monthLong = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];

  const monthLengths = [
    31, 28.25, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31
  ];

  const rainfallCache = new Map();

  
  
  

  const filters = [
    ...document.querySelectorAll(".dz-filter")
  ];

  const townSelect = document.getElementById("townSelect");
  const mapElement = document.getElementById("dryZoneMap");
  const mapFallback = document.getElementById("mapFallback");
  const atlasCount = document.getElementById("atlasCount");

  const rainToggle = document.getElementById("rainToggle");
  const rainPanel = document.getElementById("rainPanel");
  const rainStatus = document.getElementById("rainStatus");
  const rainVisual = document.getElementById("rainVisual");
  const rainChart = document.getElementById("rainChart");
  const rainSummary = document.getElementById("rainSummary");
  const rainMethod = document.getElementById("rainMethod");
  const rainTableBody = document.getElementById("rainTableBody");

  let selectedId = "myingyan";
  let currentRegion = "all";
  let map = null;

  const markers = new Map();

  let loadingToken = 0;

  
  
  

  function visibleTowns() {
    if (currentRegion === "all") {
      return towns;
    }

    return towns.filter(function(town) {
      return town.region === currentRegion;
    });
  }

  function getTown(id) {
    return towns.find(function(town) {
      return town.id === id;
    });
  }

  
  
  

  function updatePanel() {
    const town = getTown(selectedId);

    if (!town) return;

    document.getElementById("townIndex").textContent =
      String(towns.indexOf(town) + 1).padStart(2, "0");

    document.getElementById("townRegion").textContent =
      regionNames[town.region];

    document.getElementById("townName").textContent =
      town.name;

    document.getElementById("townDescription").textContent =
      town.description;

    document.getElementById("townFocus").textContent =
      town.focus;

    document.getElementById("townDot").style.background =
      colors[town.region];

    townSelect.value = town.id;

    
    markers.forEach(function(marker, id) {
      const isSelected = id === selectedId;

      marker.setStyle({
        radius: isSelected ? 10 : 7,
        weight: isSelected ? 4 : 2,
        color: "#FFFFFF",
        fillColor: colors[getTown(id).region],
        fillOpacity: 1
      });

      if (isSelected) {
        marker.bringToFront();
      }
    });

    
    if (!rainPanel.hidden) {
      loadRainfall();
    }
  }

  
  
  

  function selectTown(id, focusMap = true) {
    const town = getTown(id);

    if (!town) return;

    selectedId = id;
    updatePanel();

    if (map && focusMap) {
      map.flyTo(
        [town.lat, town.lon],
        Math.max(map.getZoom(), 9),
        { duration: 0.65 }
      );
    }
  }

  function fillTownSelect() {
    const list = visibleTowns();

    townSelect.replaceChildren();

    list.forEach(function(town) {
      const option = document.createElement("option");

      option.value = town.id;
      option.textContent = town.name;

      townSelect.appendChild(option);
    });

    if (
      list.length &&
      !list.some(function(town) {
        return town.id === selectedId;
      })
    ) {
      selectedId = list[0].id;
    }

    townSelect.value = selectedId;

    atlasCount.textContent =
      list.length +
      (list.length === 1 ? " location" : " locations");
  }

  
  
  

  function fitMap() {
    if (!map || !window.L) return;

    const visible = visibleTowns();

    const bounds = window.L.latLngBounds(
      visible.map(function(town) {
        return [town.lat, town.lon];
      })
    );

    map.fitBounds(bounds, {
      padding: [34, 34],
      maxZoom: 9,
      animate: false
    });
  }

  function filterRegion(region) {
    currentRegion = region;

    filters.forEach(function(button) {
      const isActive = button.dataset.filter === region;

      button.classList.toggle("active", isActive);

      button.setAttribute(
        "aria-pressed",
        String(isActive)
      );
    });

    
    markers.forEach(function(marker, id) {
      const town = getTown(id);

      const visible =
        region === "all" ||
        town.region === region;

      if (!map) return;

      if (visible && !map.hasLayer(marker)) {
        marker.addTo(map);
      }

      if (!visible && map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    fillTownSelect();
    updatePanel();
    fitMap();
  }

  
  if (townSelect) {
    townSelect.addEventListener("change", function() {
      selectTown(townSelect.value);
    });
  }

  
  filters.forEach(function(button) {
    button.addEventListener("click", function() {
      filterRegion(button.dataset.filter);
    });
  });

  
  document
    .getElementById("atlasReset")
    .addEventListener("click", function() {
      filterRegion("all");
    });

  
  
  

  document
    .querySelectorAll("[data-hero-region]")
    .forEach(function(link) {

      link.addEventListener("click", function() {
        filterRegion(link.dataset.heroRegion);
      });

    });

  
  
  

  function initMap() {
    if (
      !mapElement ||
      typeof window.L === "undefined"
    ) {
      if (mapFallback) {
        mapFallback.hidden = false;
      }

      return;
    }

    map = window.L.map(mapElement, {
      scrollWheelZoom: false,
      zoomControl: true
    }).setView([21.3, 95.15], 8);

    
    const tiles = window.L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
        maxZoom: 18
      }
    );

    let tileFailed = false;

    tiles.on("tileerror", function() {
      tileFailed = true;

      if (mapFallback) {
        mapFallback.hidden = false;
      }
    });

    tiles.on("load", function() {
      if (!tileFailed && mapFallback) {
        mapFallback.hidden = true;
      }
    });

    tiles.addTo(map);

    
    towns.forEach(function(town) {
      const marker = window.L.circleMarker(
        [town.lat, town.lon],
        {
          radius: 7,
          weight: 2,
          color: "#FFFFFF",
          fillColor: colors[town.region],
          fillOpacity: 1
        }
      );

      marker.bindTooltip(town.name, {
        direction: "top",
        offset: [0, -7]
      });

      marker.on("click", function() {
        selectTown(town.id, false);
      });

      markers.set(town.id, marker);
      marker.addTo(map);
    });

    fitMap();

    
    window.addEventListener("resize", function() {
      map.invalidateSize(false);
    });
  }

  
  
  

   

  async function requestRainfall(town) {
    const url = new URL(
      "https://power.larc.nasa.gov/api/temporal/monthly/climatology/point"
    );

    url.search = new URLSearchParams({
      parameters: "PRECTOTCORR",
      community: "AG",
      longitude: String(town.lon),
      latitude: String(town.lat),
      format: "JSON",
      start: "1991",
      end: "2020"
    }).toString();

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        "NASA POWER returned HTTP " + response.status
      );
    }

    const json = await response.json();

    const observed =
      json?.properties?.parameter?.PRECTOTCORR;

    if (!observed) {
      throw new Error(
        "No precipitation data was returned."
      );
    }

    const unit =
      json?.parameters?.PRECTOTCORR?.units || "mm/day";

    const data = months.map(function(month, index) {
      const reading = Number(observed[month]);

      if (
        !Number.isFinite(reading) ||
        reading < 0 ||
        reading === -999
      ) {
        throw new Error(
          "Monthly rainfall data is incomplete."
        );
      }

      
      const dailyUnit =
        unit.toLowerCase().includes("mm/day") ||
        unit.toLowerCase().includes("mm/d");

      return dailyUnit
        ? reading * monthLengths[index]
        : reading;
    });

    return {
      data: data,
      period: "1991–2020",
      unit: unit,
      apiUrl: url.toString()
    };
  }

  
  
  

  function makeSVG(name, attributes = {}, text = null) {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      name
    );

    Object.entries(attributes).forEach(function(entry) {
      element.setAttribute(
        entry[0],
        String(entry[1])
      );
    });

    if (text !== null) {
      element.textContent = text;
    }

    return element;
  }

  
  
  

  function renderRainfall(result) {
    const values = result.data;

    const maximum = Math.max(1, ...values);
    const top = Math.ceil(maximum / 50) * 50 || 50;

    const baseline = 158;
    const chartTop = 16;
    const available = baseline - chartTop;

    rainChart.replaceChildren();

    rainChart.appendChild(
      makeSVG(
        "title",
        {},
        "Historical monthly rainfall estimates for " +
          getTown(selectedId).name
      )
    );

    rainChart.appendChild(
      makeSVG(
        "desc",
        {},
        "NASA POWER rainfall climatology from 1991 to 2020. Values are approximate millimetres per month."
      )
    );

    
    [0, 0.5, 1].forEach(function(fraction) {
      const y = baseline - available * fraction;

      rainChart.appendChild(
        makeSVG("line", {
          x1: 32,
          y1: y,
          x2: 416,
          y2: y,
          stroke: "#DBE4EB",
          "stroke-width": 1
        })
      );

      rainChart.appendChild(
        makeSVG(
          "text",
          {
            x: 1,
            y: y + 4,
            fill: "#849AAE",
            "font-size": 10
          },
          String(Math.round(top * fraction))
        )
      );
    });

    
    values.forEach(function(value, index) {
      const height = available * (value / top);

      const x = 36 + index * 31.5;

      const isWetterSeason =
        index >= 4 && index <= 9;

      const bar = makeSVG("rect", {
        x: x,
        y: baseline - height,
        width: 20,
        height: Math.max(0.6, height),
        rx: 2,
        fill: isWetterSeason
          ? "#4E7BB6"
          : "#BBA787"
      });

      bar.appendChild(
        makeSVG(
          "title",
          {},
          monthLong[index] +
            ": " +
            value.toFixed(1) +
            " mm (estimated monthly amount)"
        )
      );

      rainChart.appendChild(bar);

      rainChart.appendChild(
        makeSVG(
          "text",
          {
            x: x + 10,
            y: 177,
            fill: "#58758A",
            "font-size": 9,
            "text-anchor": "middle"
          },
          months[index]
        )
      );
    });

    
    rainTableBody.replaceChildren();

    values.forEach(function(value, index) {
      const row = document.createElement("tr");

      const monthCell = document.createElement("td");
      monthCell.textContent = monthLong[index];

      const amountCell = document.createElement("td");
      amountCell.textContent = value.toFixed(1);

      row.append(monthCell, amountCell);
      rainTableBody.appendChild(row);
    });

    
    const peak = values.indexOf(
      Math.max(...values)
    );

    rainSummary.textContent =
      "Highest estimated average: " +
      monthLong[peak] +
      " (" +
      values[peak].toFixed(1) +
      " mm). These are historical monthly estimates, not a forecast.";

    rainStatus.textContent =
      "NASA POWER precipitation climatology, 1991–2020";

    
    rainMethod.replaceChildren();

    rainMethod.append(
      "Source: NASA POWER (1991–2020). Monthly estimates are derived from mean daily precipitation when supplied in mm/day. Town-centre gridded estimates are not rain-gauge observations. "
    );

    const link = document.createElement("a");

    link.href = result.apiUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View data request";

    rainMethod.appendChild(link);

    rainVisual.hidden = false;
  }

  
  
  

  async function loadRainfall() {
    const requestId = ++loadingToken;

    rainVisual.hidden = true;

    rainStatus.textContent =
      "Loading historical rainfall estimates from NASA POWER…";

    const town = getTown(selectedId);

    try {
      let result = rainfallCache.get(town.id);

      if (!result) {
        result = await requestRainfall(town);
        rainfallCache.set(town.id, result);
      }

      
      if (
        requestId !== loadingToken ||
        rainPanel.hidden
      ) {
        return;
      }

      renderRainfall(result);

    } catch (error) {
      if (
        requestId !== loadingToken ||
        rainPanel.hidden
      ) {
        return;
      }

      rainStatus.textContent =
        "Rainfall data could not be loaded. Check your internet connection or consult NASA POWER. No values are displayed without data.";

      console.warn(
        "HYDRIX rainfall load:",
        error
      );
    }
  }

  
  
  

  if (rainToggle) {
    rainToggle.addEventListener("click", function() {
      const willOpen = rainPanel.hidden;

      rainPanel.hidden = !willOpen;

      rainToggle.setAttribute(
        "aria-expanded",
        String(willOpen)
      );

      if (willOpen) {
        loadRainfall();
      } else {
        loadingToken++;
        rainVisual.hidden = true;
      }
    });
  }

  
  
  

  fillTownSelect();
  initMap();
  updatePanel();

  
  
  

  const pages = [
    {
      name: "Home",
      link: "index.html",
      terms: "home introduction"
    },
    {
      name: "Drought",
      link: "drought.html",
      terms: "types causes definition"
    },
    {
      name: "Myanmar Dry Zone",
      link: "dryzone.html",
      terms: "map atlas rainfall sagaing mandalay magway"
    },
    {
      name: "Water Conservation",
      link: "conservation.html",
      terms: "water saving calculator"
    },
    {
      name: "Preparedness",
      link: "preparedness.html",
      terms: "checklist water shortage"
    },
    {
      name: "Learning",
      link: "learning.html",
      terms: "water education impact explorer"
    },
    {
      name: "About Us",
      link: "about.html",
      terms: "team mission"
    },
    {
      name: "Contact",
      link: "contact.html",
      terms: "feedback email"
    },
    {
      name: "FAQs",
      link: "faq.html",
      terms: "questions answers"
    }
  ];

  document
    .querySelectorAll(".search-wrap")
    .forEach(function(wrap) {

      const input = wrap.querySelector(".search-input");
      const menu = wrap.querySelector(".search-menu");
      const clear = wrap.querySelector(".search-clear");

      if (!input || !menu || !clear) return;

      function updateSearch() {
        const query = input.value.trim().toLowerCase();

        menu.replaceChildren();

        clear.style.display = query
          ? "block"
          : "none";

        wrap.classList.toggle(
          "open",
          Boolean(query)
        );

        if (!query) return;

        const matches = pages.filter(function(page) {
          return (
            page.name + " " + page.terms
          ).toLowerCase().includes(query);
        });

        if (!matches.length) {
          const message = document.createElement("div");

          message.className = "search-empty";
          message.textContent = "No matching pages.";

          menu.appendChild(message);
          return;
        }

        matches.forEach(function(page) {
          const link = document.createElement("a");

          link.className = "search-result";
          link.href = page.link;
          link.textContent = page.name;

          menu.appendChild(link);
        });
      }

      input.addEventListener("input", updateSearch);

      input.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
          wrap.classList.remove("open");
        }

        if (event.key === "Enter") {
          const first = menu.querySelector("a");

          if (first) {
            window.location.href = first.href;
          }
        }
      });

      clear.addEventListener("click", function() {
        input.value = "";
        updateSearch();
        input.focus();
      });

      document.addEventListener("click", function(event) {
        if (!wrap.contains(event.target)) {
          wrap.classList.remove("open");
        }
      });
    });

  
  
  

  const reducedMotion = window
    .matchMedia("(prefers-reduced-motion: reduce)")
    .matches;

  if (
    !reducedMotion &&
    "IntersectionObserver" in window
  ) {
    const observer = new IntersectionObserver(
      function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    document
      .querySelectorAll("main .reveal")
      .forEach(function(element) {
        observer.observe(element);
      });

    document.body.classList.add("js-reveal");
  }

})();
