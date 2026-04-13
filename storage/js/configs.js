// * Stav prodeje
export const statusConfig = {
  "available": {
    "cs-CZ": "Volný",
    "en-US": "Available"
  },
  "under-offer": {
    "cs-CZ": "V jednání",
    "en-US": "Under offer"
  },
  "sold": {
    "cs-CZ": "Prodaný",
    "en-US": "Sold"
  },
  "show": {
    "cs-CZ": "Ukázkový dům",
    "en-US": "Model home"
  },
  "unknown": {
    "cs-CZ": "Neznámý",
    "en-US": "Unknown"
  },
};

// * Příslušenství
export const amenitiesConfig = {
  "B": {
    icon: "fa-solid fa-square-b",
    name: {
      "cs-CZ": "Balkón",
      "en-US": "Balcony"
    },
    tooltip: {
      "cs-CZ": "V ceně je balkón.",
      "en-US": "Price includes a balcony."
    }
  },
  "G": {
    icon: "fa-solid fa-square-g",
    name: {
      "cs-CZ": "Garáž",
      "en-US": "Garage"
    },
    tooltip: {
      "cs-CZ": "V ceně je garáž.",
      "en-US": "Price includes a garage."
    }
  },
  "P": {
    icon: "fa-solid fa-square-p",
    name: {
      "cs-CZ": "Parkování",
      "en-US": "Parking"
    },
    tooltip: {
      "cs-CZ": "Nemovitost zahrnuje parkovací stání",
      "en-US": "Property includes parking space"
    }
  },
  "S": {
    icon: "fa-solid fa-square-s",
    name: {
      "cs-CZ": "Sklep",
      "en-US": "Cellar"
    },
    tooltip: {
      "cs-CZ": "Nemovitost zahrnuje sklep",
      "en-US": "Property includes a cellar"
    }
  },
  "T": {
    icon: "fa-solid fa-square-t",
    name: {
      "cs-CZ": "Terasa",
      "en-US": "Terrace"
    },
    tooltip: {
      "cs-CZ": "V ceně je terasa.",
      "en-US": "Price includes a terrace"
    }
  },
  "Z": {
    icon: "fa-solid fa-square-z",
    name: {
      "cs-CZ": "Zahrada",
      "en-US": "Garden"
    },
    tooltip: {
      "cs-CZ": "V ceně je zahrada a předzahrádka.",
      "en-US": "Price includes a garden and a front yard."
    }
  },
};

// * Speciální vybavení
export const specialEquipmentConfig = {
  "klima": {
    filename: "klima",
    tooltip: {
      "cs-CZ": "V ceně je stropní vytápění a chlazení.",
      "en-US": "Price includes ceiling heating and cooling."
    }
  },
  "rekuperace": {
    filename: "rekuperace",
    tooltip: {
      "cs-CZ": "V ceně je rekuperace bez dochlazování.",
      "en-US": "Price includes heat recovery without after cooling."
    }
  },
  "rolety": {
    filename: "zaluzie",
    tooltip: {
      "cs-CZ": "V ceně jsou předokenní žaluzie.",
      "en-US": "Price includes external blinds."
    }
  },
  "rolety-priprava": {
    filename: "zaluzie-priprava",
    tooltip: {
      "cs-CZ": "V ceně je elektropříprava pro předokenní žaluzie.",
      "en-US": "Price includes wiring for external blinds."
    }
  },
  "rolety-priprava-cast": {
    filename: "zaluzie-priprava-cast",
    tooltip: {
      "cs-CZ": "V ceně je elektropříprava pro předokenní žaluzie u části oken.",
      "en-US": "Price includes wiring for external blinds for some windows."
    }
  },
}