import { Box, Heading, HStack, Input, SimpleGrid, Text, VStack, Tag } from '@chakra-ui/react'
import { useMemo, useState } from 'react'

const MOCK = [
  { id: 'pr1', nombre: 'Producto A', tipo: 'INSUMO', stock: 120 },
  { id: 'pr2', nombre: 'Producto B', tipo: 'TERMINADO', stock: 40 },
  { id: 'pr3', nombre: 'Servicio C', tipo: 'SERVICIO', stock: 0 },
]

export default function Productos() {
  const [q, setQ] = useState('')
  const filtrados = useMemo(() => MOCK.filter(p => (p.nombre + p.tipo).toLowerCase().includes(q.toLowerCase())), [q])
  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Heading size="lg">Productos</Heading>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto" maxW="320px" />
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {filtrados.map((p) => (
          <Box key={p.id} p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="semibold">{p.nombre}</Text>
              <Tag>{p.tipo}</Tag>
            </HStack>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>Stock: {p.stock}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
