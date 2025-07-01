import inquirer from "inquirer";


const currencies = new Map();
const latestExchange = new Map();
const exchangeHistory = new Array();
const apiKey = "fca_live_Ct54Yyv3XvnLNAcPdDdVWxy7NTOetOUXk5MwwEca"
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



async function loadCurrencies() {
  // this function load all of currencies of the api
  // I try to call this function just one time
  const endPoint = "currencies"
  let res = await fetch(`${seed}${endPoint}?apikey=${apiKey}`);
  let json = await res.json();
  for (const element of Object.keys(json.data)) {
    const { code, name, symbol, decimal_digits } = json.data[element];
    const reductedCurrency = { code, name, symbol, decimal_digits }
    currencies.set(element, reductedCurrency)
  }
}


async function loadExchanges() {
  let endPoint = "latest"
  let res;
  try {
    res = await fetch(`${seed}${endPoint}?apikey=${apiKey}&base_currency=${baseCurrency}`);

  } catch (error) {
    console.log(`Hubo un error ${error}`)
    return;
  }
  let json = await res.json();
  let date = new Date()
  json.data["date"] = getDateLikeString(date)
  latestExchange.set(baseCurrency, json.data);
}


// utils 
const getDateLikeString = (date) => {
  return date.toISOString().split("T")[0]
}



const validateStatusOfExchange = async () => {
  if (!latestExchange.has(baseCurrency)) {
    await loadExchanges()
    return;
  }
  let date = new Date()
  let latestExchangeOfCurrececy = latestExchange.get(baseCurrency)
  if (latestExchangeOfCurrececy.date !== getDateLikeString(date)) {
    await loadExchanges()
  }
}


const convert = async (amount, baseCurrency, targetCurrency) =>{
  await validateStatusOfExchange();

  const rates = latestExchange.get(baseCurrency);
  if (!rates) {
    throw new Error(`No se encontraron tasas para la moneda base: ${baseCurrency}`);
  }

  const exchangeRate = rates[targetCurrency];
  if (!exchangeRate) {
    throw new Error(`No se encontró tasa de cambio de ${baseCurrency} a ${targetCurrency}`);
  }

  let total = amount * exchangeRate;

  exchangeHistory.push(createHisotoryImboun(amount, baseCurrency, targetCurrency, exchangeRate, total)); 
  return total;
}


const createHisotoryImboun = (amount, baseCurrency, targetCurrency, exchangeRate , total) =>{

    return {amount: amount, 
            baseCurrency: baseCurrency, 
            targetCurrency: targetCurrency, 
            exchangeRate:exchangeRate,
            date: new Date(),
            total: total}
}

async function showHistory() {
  if (exchangeHistory.length === 0) {
    console.log("No hay conversiones en esta sesión.");
    return;
  }

  exchangeHistory.forEach((entry, index) => {
    console.log(
      `${index + 1}. ${entry.amount} ${entry.baseCurrency} -> ${entry.total.toFixed(2)} ${entry.targetCurrency} @ ${entry.exchangeRate} (${entry.date.toLocaleString()})`
    );
  });
}



// show menus or somenting
async function showCurrencies() {
  // this function
  if (currencies.size === 0) {
    await loadCurrencies()
  }
  for (const [_, currency] of currencies) {
    console.log(`  ==> ${currency.code} - ${currency.name} - ${currency.symbol}`)
  }

}


async function showInputNumber() {
  let amount= await inquirer.prompt(
    [
      {
        name: "exchange",
        type: "number",
        message: `===== Convierte tu moneda ==> :`,
        choices: Array.from(currencies.keys())
      }
    ]
  )

  let newAmount = await convert(amount.exchange, baseCurrency, targetCurrency);
  console.log(`  ==> ${amount.exchange} ${baseCurrency} = ${newAmount.toFixed(2)} ${targetCurrency}`);
}


async function showExchangeRates() {

  if (currencies.size === 0) {
    await loadCurrencies()
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
  await validateStatusOfExchange();
  const data = latestExchange.get(baseCurrency);
  // separator 
  console.log()
  selectedCurrencies.showExchangeRate.forEach(element => {
    console.log(`  ==> 1 ${baseCurrency} = ${element} ${data[element].toFixed(2)}`)
  });
  // separator 
  console.log()
}


async function showSelect(string) {

  if (currencies.size === 0) {
    await loadCurrencies()
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