
 

(() => {
  "use strict";

  const pages = [
    {
      title: "Home",
      href: "index.html",
      words: "welcome hydrix overview"
    },
    {
      title: "Understanding Drought",
      href: "drought.html",
      words: "types causes signs rainfall impacts"
    },
    {
      title: "Myanmar's Dry Zone",
      href: "dryzone.html",
      words: "map atlas mandalay magway sagaing"
    },
    {
      title: "Water Saving",
      href: "conservation.html",
      words: "water conservation calculator tips"
    },
    {
      title: "Preparedness",
      href: "preparedness.html",
      words: "checklist emergency prepare drought"
    },
    {
      title: "Learn",
      href: "learning.html",
      words: "education interactive impact explorer"
    },
    {
      title: "About Us",
      href: "about.html",
      words: "team mission vision students"
    },
    {
      title: "FAQs",
      href: "faq.html",
      words: "questions answers"
    },
    {
      title: "Contact Us",
      href: "contact.html",
      words: "message contact"
    }
  ];

  function setupSearch(wrapper) {
    const input = wrapper.querySelector(".search-input");
    const clearButton = wrapper.querySelector(".search-clear");
    const menu = wrapper.querySelector(".search-menu");

    if (!input || !menu) return;

    let results = [];
    let selected = -1;

    function closeSearch() {
      menu.classList.remove("is-open");
      input.setAttribute("aria-expanded", "false");
      selected = -1;
    }

    function updateSelection() {
      menu.querySelectorAll(".search-result").forEach(
        (item, index) => {
          item.classList.toggle(
            "is-selected",
            index === selected
          );
        }
      );
    }

    function renderResults() {
      const query = input.value.trim().toLowerCase();

      wrapper.classList.toggle(
        "has-value",
        input.value.length > 0
      );

      results = query
        ? pages.filter((page) =>
            `${page.title} ${page.words}`
              .toLowerCase()
              .includes(query)
          ).slice(0, 6)
        : pages.slice(1, 5);

      selected = -1;
      menu.replaceChildren();

      if (results.length === 0) {
        const empty = document.createElement("div");
        empty.className = "search-empty";
        empty.textContent = "No matching HYDRIX pages";
        menu.append(empty);
      } else {
        results.forEach((page) => {
          const link = document.createElement("a");
          link.href = page.href;
          link.className = "search-result";

          const title = document.createElement("span");
          title.textContent = page.title;

          const label = document.createElement("small");
          label.textContent = "OPEN ↗";

          link.append(title, label);
          menu.append(link);
        });
      }

      menu.classList.add("is-open");
      input.setAttribute("aria-expanded", "true");
    }

    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");

    input.addEventListener("focus", renderResults);
    input.addEventListener("input", renderResults);

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSearch();
        input.blur();
        return;
      }

      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp"
      ) {
        event.preventDefault();

        if (!menu.classList.contains("is-open")) {
          renderResults();
        }

        if (results.length > 0) {
          selected = event.key === "ArrowDown"
            ? (selected + 1) % results.length
            : (selected - 1 + results.length) % results.length;

          updateSelection();
        }
      }

      if (
        event.key === "Enter" &&
        results.length > 0 &&
        menu.classList.contains("is-open")
      ) {
        event.preventDefault();

        const destination = results[
          Math.max(selected, 0)
        ].href;

        window.location.assign(destination);
      }
    });

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        input.value = "";
        input.focus();
        renderResults();
      });
    }

    document.addEventListener("pointerdown", (event) => {
      if (!wrapper.contains(event.target)) {
        closeSearch();
      }
    });
  }

  document.querySelectorAll(".search-wrap").forEach(
    setupSearch
  );
})();
