import { Box, VStack, Text, Link as ChakraLink, Icon, HStack } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'
import { FiHome, FiCheckSquare, FiBriefcase, FiUsers, FiBarChart2, FiBookOpen, FiCalendar, FiDollarSign, FiTruck, FiShoppingCart, FiCpu, FiDatabase, FiBox } from 'react-icons/fi'

const NavItem = ({ to, icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink to={to}>
    {({ isActive }: { isActive: boolean }) => (
      <ChakraLink _hover={{ textDecoration: 'none' }} w="full">
        <HStack px={4} py={3} rounded="md" bg={isActive ? 'blackAlpha.50' : 'transparent'} _dark={{ bg: isActive ? 'whiteAlpha.100' : 'transparent' }}>
          <Icon as={icon} />
          <Text fontWeight={isActive ? 'semibold' : 'medium'}>{label}</Text>
        </HStack>
      </ChakraLink>
    )}
  </NavLink>
)

export default function Sidebar() {
  return (
    <Box as="nav" position="fixed" left={0} top={0} w={{ base: 0, md: 64 }} h="100vh" borderRightWidth="1px" bg="white" _dark={{ bg: 'gray.800' }} display={{ base: 'none', md: 'block' }}>
      <VStack align="stretch" spacing={2} p={4}>
        <Text fontSize="lg" fontWeight="bold" mb={2}>Muralla Demo</Text>
        <NavItem to="/" icon={FiHome} label="Tablero" />
        <NavItem to="/tareas" icon={FiCheckSquare} label="Tareas" />
        <NavItem to="/proyectos" icon={FiBriefcase} label="Proyectos" />
        <NavItem to="/equipo" icon={FiUsers} label="Equipo" />
        <NavItem to="/reportes" icon={FiBarChart2} label="Reportes" />
        <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }} mt={3}>Operaciones</Text>
        <NavItem to="/operaciones/productos" icon={FiBox} label="Productos" />
        <NavItem to="/operaciones/inventario" icon={FiDatabase} label="Inventario" />
        <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }} mt={3}>Gestión</Text>
        <NavItem to="/conocimiento" icon={FiBookOpen} label="Conocimiento" />
        <NavItem to="/calendario" icon={FiCalendar} label="Calendario" />
        <NavItem to="/finanzas" icon={FiDollarSign} label="Finanzas" />
        <NavItem to="/proveedores" icon={FiTruck} label="Proveedores" />
        <NavItem to="/compras" icon={FiShoppingCart} label="Compras" />
        <NavItem to="/produccion" icon={FiCpu} label="Producción" />
        <NavItem to="/bancos" icon={FiDollarSign} label="Bancos" />
        <NavItem to="/clientes" icon={FiUsers} label="Clientes" />
      </VStack>
    </Box>
  )
}
