import { Box, Heading, SimpleGrid, Text, VStack, Tag } from '@chakra-ui/react'

export default function Produccion() {
  const mock = [
    { id: 'wo-101', nombre: 'Orden de trabajo 101', estado: 'Planificada', avance: '0%' },
    { id: 'wo-102', nombre: 'Orden de trabajo 102', estado: 'En proceso', avance: '45%' },
    { id: 'wo-103', nombre: 'Orden de trabajo 103', estado: 'Completada', avance: '100%' },
  ]
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="lg">Producción</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {mock.map((w) => (
          <Box key={w.id} p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
            <Heading size="sm" mb={2}>{w.nombre}</Heading>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>Avance: {w.avance}</Text>
            <Tag mt={3}>{w.estado}</Tag>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
