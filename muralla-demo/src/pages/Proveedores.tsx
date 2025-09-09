import { Box, Heading, HStack, Input, SimpleGrid, Text, VStack, Tag } from '@chakra-ui/react'
import { useState, useMemo } from 'react'

const MOCK = [
  { id: 'v1', nombre: 'Proveedor Uno', rubro: 'Logística', contacto: 'contacto1@ejemplo.com' },
  { id: 'v2', nombre: 'Proveedor Dos', rubro: 'Insumos', contacto: 'contacto2@ejemplo.com' },
  { id: 'v3', nombre: 'Proveedor Tres', rubro: 'Servicios', contacto: 'contacto3@ejemplo.com' },
]

export default function Proveedores() {
  const [q, setQ] = useState('')
  const filtrados = useMemo(() => MOCK.filter(v => (v.nombre + v.rubro + v.contacto).toLowerCase().includes(q.toLowerCase())), [q])
  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Heading size="lg">Proveedores</Heading>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proveedor" maxW="320px" />
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {filtrados.map((v) => (
          <Box key={v.id} p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="semibold">{v.nombre}</Text>
              <Tag>{v.rubro}</Tag>
            </HStack>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>{v.contacto}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
