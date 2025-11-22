export const getIndicators = async (req, res) => {
  try {
    // Conectamos con la API del gobierno/mindicador
    const response = await fetch('https://mindicador.cl/api');
    
    if (!response.ok) {
      throw new Error('Error al conectar con mindicador.cl');
    }

    const data = await response.json();

    // Filtramos solo lo que nos interesa para no enviar basura al frontend
    const indicators = {
      uf: {
        valor: data.uf.valor,
        nombre: 'UF',
        codigo: 'uf'
      },
      dolar: {
        valor: data.dolar.valor,
        nombre: 'Dólar Observado',
        codigo: 'dolar'
      },
      euro: {
        valor: data.euro.valor,
        nombre: 'Euro',
        codigo: 'euro'
      },
      utm: {
        valor: data.utm.valor,
        nombre: 'UTM',
        codigo: 'utm'
      },
      fecha: data.fecha // Fecha de actualización
    };

    res.json(indicators);
  } catch (error) {
    console.error('Error obteniendo indicadores:', error);
    res.status(500).json({ message: 'No se pudieron obtener los indicadores económicos' });
  }
};