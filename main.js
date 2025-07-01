// external modules 
import inquirer from "inquirer";
import dotenv from "dotenv";

// my modules
import { loadCurrencies } from "./api-loaders.js";
import { convert, validateStatusOfExchange, syncSeparator } from "./utils.js"


dotenv.config();
const currencies = new Map();
const latestExchange = new Map();
const exchangeHistory = new Array();
const apiKey = process.env.API_KEY;
const seed = "http://api.freecurrencyapi.com/v1/"

let baseCurrency = "USD";
let targetCurrency = "EUR";

// this object contains the functions to manage the task of the menu
const mainMenuHash = {
  'Ver lista de monedas disponibles': showCurrencies,
  'Ver tasas de cambio': showExchangeRates,
  'Establecer moneda origen/destino': displaySelectMenus,
  'Establecer cantidad': showInputNumber,
  'Ver historial de conversiones': showHistory,
  'Salir': "Salir"
};



// utils 
async function showHistory() {
  if (exchangeHistory.length === 0) {
    console.log("No hay conversiones en esta sesión.");
    return;
  }

  syncSeparator(
    () => {
      exchangeHistory.forEach((entry, index) => {
        console.log(
          `${index + 1}. ${entry.amount} ${entry.baseCurrency} -> ${entry.total.toFixed(2)} ${entry.targetCurrency} @ ${entry.exchangeRate} (${entry.date.toLocaleString()})`
        );
      });
    }
  )


}



// show menus or somenting
async function showCurrencies() {
  // this function
  if (currencies.size === 0) {
    await loadCurrencies(seed, apiKey, currencies)
  }

  syncSeparator(() => {
    for (const [, currency] of currencies) {
      console.log(`  ==> ${currency.code} - ${currency.name} - ${currency.symbol}`)
    }
  })

}


async function showInputNumber() {
  let amount = await inquirer.prompt(
    [
      {
        name: "exchange",
        type: "number",
        message: `===== Convierte tu moneda ==> :`,
        validate: (value) => {
          if (isNaN(value) || value <= 0) {
            return "Ingresa un número mayor a cero";
          }
          return true;
        }
      }
    ]
  )

  let newAmount = await convert(
    amount.exchange,
    baseCurrency,
    targetCurrency,
    latestExchange,
    exchangeHistory,
    seed,
    apiKey
  );
  syncSeparator(() => {
    console.log(`  ==> ${amount.exchange} ${baseCurrency} = ${newAmount.toFixed(2)} ${targetCurrency}`);
  })

}


async function showExchangeRates() {
  if (currencies.size === 0) {
    await loadCurrencies(seed, apiKey, currencies)
  }

  let selectedCurrencies = await inquirer.prompt(
    [
      {
        name: "showExchangeRate",
        type: "checkbox",
        message: `===== SELECCIONA TU TASA DE CAMBIO ====`,
        choices: Array.from(currencies.keys())
      }
    ]
  )
  await validateStatusOfExchange(latestExchange, baseCurrency, seed, apiKey);
  const data = latestExchange.get(baseCurrency);

  syncSeparator(() => {
    selectedCurrencies.showExchangeRate.forEach(element => {
      console.log(`  ==> 1 ${baseCurrency} = ${element} ${data[element].toFixed(2)}`)
    });
  })

}


async function showSelect(string) {

  if (currencies.size === 0) {
    await loadCurrencies(seed, apiKey, currencies)
  }

  let currencySelected = await inquirer.prompt(
    [
      {
        name: `Select${string}`,
        type: "select",
        message: `Selecciona la moneda de ${string}`,
        choices: Array.from(currencies.keys())
      }
    ]
  )
  return currencySelected[`Select${string}`];
}


async function displaySelectMenus() {
  let originCurrency = await showSelect("origen")
  let destinationCurrency = await showSelect("destino")
  baseCurrency = originCurrency;
  targetCurrency = destinationCurrency;
}


async function showMenu() {
  const options = Object.keys(mainMenuHash)
  const answer = inquirer.prompt(
    [
      {
        name: "mainMenu",
        type: "list",
        message:
          `=== MENU CONVERTIDOR DE DIVISAS ===
  ==> Moneda BASE ${baseCurrency}
  ==> Moneda Destino ${targetCurrency}
  `,
        choices: options
      }
    ]
  )

  return answer
}


async function main() {
  // this function runs the main menu and manage 
  let exit = false;

  while (!exit) {
    const answer = await showMenu();
    let value = mainMenuHash[answer.mainMenu]

    if (value === "Salir") {
      exit = true;
      return;
    }

    await value()
  }
}

main()