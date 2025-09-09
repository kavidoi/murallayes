import { Box, Heading, HStack, Input, SimpleGrid, Text, VStack, Tag } from '@chakra-ui/react'
import { useMemo, useState } from 'react'

const MOCK = [
  { id: 'o1', proveedor: 'Proveedor Uno', total: 125000, estado: 'Pendiente' },
  { id: 'o2', proveedor: 'Proveedor Dos', total: 89000, estado: 'Recibido' },
  { id: 'o3', proveedor: 'Proveedor Tres', total: 45000, estado: 'En tránsito' },
]

export default function Compras() {
  const [q, setQ] = useState('')
  const filtradas = useMemo(() => MOCK.filter(o => (o.proveedor + o.estado + o.total).toString().toLowerCase().includes(q.toLowerCase())), [q])
  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Heading size="lg">Compras</Heading>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar orden" maxW="320px" />
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {filtradas.map((o) => (
          <Box key={o.id} p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="semibold">Orden #{o.id.toUpperCase()}</Text>
              <Tag>{o.estado}</Tag>
            </HStack>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>Proveedor: {o.proveedor}</Text>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>Total: ${o.total.toLocaleString()}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
