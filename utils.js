import { loadExchanges } from "./api-loaders.js";



export const getDateLikeString = (date) => {
  return date.toISOString().split("T")[0]
}
export const convert = async (amount, baseCurrency, targetCurrency, latestExchange, exchangeHistory, seed, apiKey) =>{

  await validateStatusOfExchange(latestExchange, baseCurrency, seed, apiKey);


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




export const validateStatusOfExchange = async (latestExchange, baseCurrency, seed, apiKey) => {
  if (!latestExchange.has(baseCurrency)) {
    await loadExchanges(seed, apiKey, baseCurrency, latestExchange)
    return;
  }
  let date = new Date()
  let latestExchangeOfCurrececy = latestExchange.get(baseCurrency)
  if (latestExchangeOfCurrececy.date !== getDateLikeString(date)) {
    await loadExchanges(seed, apiKey, baseCurrency, latestExchange)
  }
}






