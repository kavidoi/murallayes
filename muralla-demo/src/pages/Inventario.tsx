import { Box, Heading, HStack, Input, SimpleGrid, Text, VStack, Tag } from '@chakra-ui/react'
import { useMemo, useState } from 'react'

const MOCK = [
  { id: 'loc-1', nombre: 'Bodega Central', items: 1520, estado: 'OK' },
  { id: 'loc-2', nombre: 'Tienda 1', items: 320, estado: 'Bajo stock' },
  { id: 'loc-3', nombre: 'Tienda 2', items: 410, estado: 'OK' },
]

export default function Inventario() {
  const [q, setQ] = useState('')
  const filtrados = useMemo(() => MOCK.filter(l => (l.nombre + l.estado + l.items).toString().toLowerCase().includes(q.toLowerCase())), [q])
  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Heading size="lg">Inventario</Heading>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ubicación" maxW="320px" />
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {filtrados.map((l) => (
          <Box key={l.id} p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="semibold">{l.nombre}</Text>
              <Tag>{l.estado}</Tag>
            </HStack>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>Ítems: {l.items}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
