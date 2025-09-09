import { Box, Flex } from '@chakra-ui/react'
import { Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/common/NavBar'
import Sidebar from './components/common/Sidebar'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Projects from './pages/Projects'
import Team from './pages/Team'
import Reports from './pages/Reports'
import Conocimiento from './pages/Conocimiento'
import Calendario from './pages/Calendario'
import Finanzas from './pages/Finanzas'
import Proveedores from './pages/Proveedores'
import Compras from './pages/Compras'
import Produccion from './pages/Produccion'
import Bancos from './pages/Bancos'
import Productos from './pages/Productos'
import Inventario from './pages/Inventario'
import Clientes from './pages/Clientes'
import { useDemo } from './context/DemoContext'

export default function App() {
  const { presentationMode } = useDemo()
  return (
    <Flex minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      {!presentationMode && <Sidebar />}
      <Box flex="1" pl={{ base: 0, md: presentationMode ? 0 : 64 }}>
        <NavBar />
        <Box as="main" p={6}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tareas" element={<Tasks />} />
            <Route path="/proyectos" element={<Projects />} />
            <Route path="/equipo" element={<Team />} />
            <Route path="/reportes" element={<Reports />} />
            <Route path="/conocimiento" element={<Conocimiento />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/finanzas" element={<Finanzas />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/produccion" element={<Produccion />} />
            <Route path="/bancos" element={<Bancos />} />
            <Route path="/operaciones/productos" element={<Productos />} />
            <Route path="/operaciones/inventario" element={<Inventario />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    </Flex>
  )
}
