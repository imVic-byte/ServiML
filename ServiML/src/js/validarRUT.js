export const validarRut = (rut) => {
  if (!/^[0-9]+-[0-9kK]{1}$/.test(rut)) return false;

  const [numero, dv] = rut.split("-");
  let suma = 0;
  let multiplicador = 2;

  for (let i = numero.length - 1; i >= 0; i--) {
    suma += numero[i] * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const dvEsperado = 11 - (suma % 11);
  let dvCalc = "";
  
  if (dvEsperado === 11) dvCalc = "0";
  else if (dvEsperado === 10) dvCalc = "K";
  else dvCalc = dvEsperado.toString();

  return dvCalc.toUpperCase() === dv.toUpperCase();
};