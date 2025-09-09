import { Box, Heading, Text, VStack, SimpleGrid } from '@chakra-ui/react'

export default function Finanzas() {
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="lg">Finanzas</Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Box p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
          <Heading size="sm" mb={2}>Ingresos</Heading>
          <Text color="gray.600" _dark={{ color: 'gray.300' }}>$324.500 (Mock)</Text>
        </Box>
        <Box p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
          <Heading size="sm" mb={2}>Gastos</Heading>
          <Text color="gray.600" _dark={{ color: 'gray.300' }}>$198.200 (Mock)</Text>
        </Box>
        <Box p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
          <Heading size="sm" mb={2}>Resultado</Heading>
          <Text color="gray.600" _dark={{ color: 'gray.300' }}>$126.300 (Mock)</Text>
        </Box>
      </SimpleGrid>
      <Box p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
        <Text color="gray.600" _dark={{ color: 'gray.300' }}>
          Panel de finanzas con KPIs, tendencias y reportes. (Mock)
        </Text>
      </Box>
    </VStack>
  )
}
