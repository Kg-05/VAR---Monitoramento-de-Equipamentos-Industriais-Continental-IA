import { app } from './app'

const PORT = process.env.PORT ?? 3333

app.listen(PORT, () => {
  console.log(`
  
     VAR API              
     Servidor rodando na porta ${PORT}      
     http://localhost:${PORT}/api/v1        
     http://localhost:${PORT}/health
  `)
})
