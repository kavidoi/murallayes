import { Box, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react'

export default function Bancos() {
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="lg">Bancos</Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Box p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
          <Heading size="sm" mb={2}>Cuenta Corriente</Heading>
          <Text color="gray.600" _dark={{ color: 'gray.300' }}>Saldo: $12.345.678 (Mock)</Text>
        </Box>
        <Box p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
          <Heading size="sm" mb={2}>Tarjeta Crédito</Heading>
          <Text color="gray.600" _dark={{ color: 'gray.300' }}>Disponible: $4.200.000 (Mock)</Text>
        </Box>
        <Box p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
          <Heading size="sm" mb={2}>MercadoPago</Heading>
          <Text color="gray.600" _dark={{ color: 'gray.300' }}>Saldo: $650.000 (Mock)</Text>
        </Box>
      </SimpleGrid>
    </VStack>
  )
}
