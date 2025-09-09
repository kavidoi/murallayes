import { Avatar, Box, Heading, HStack, Input, SimpleGrid, Text, VStack, Tag } from '@chakra-ui/react'
import { useMemo, useState } from 'react'

const MOCK = [
  { id: 'c1', nombre: 'Acme S.A.', categoria: 'Empresa', contacto: 'ventas@acme.com' },
  { id: 'c2', nombre: 'Juan Pérez', categoria: 'Persona', contacto: 'juan.perez@example.com' },
  { id: 'c3', nombre: 'Globex LLC', categoria: 'Empresa', contacto: 'contact@globex.com' },
]

export default function Clientes() {
  const [q, setQ] = useState('')
  const filtrados = useMemo(() => MOCK.filter(c => (c.nombre + c.categoria + c.contacto).toLowerCase().includes(q.toLowerCase())), [q])
  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Heading size="lg">Clientes</Heading>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente" maxW="320px" />
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {filtrados.map((c) => (
          <Box key={c.id} p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
            <HStack justify="space-between" mb={2}>
              <HStack>
                <Avatar name={c.nombre} size="sm" />
                <Text fontWeight="semibold">{c.nombre}</Text>
              </HStack>
              <Tag>{c.categoria}</Tag>
            </HStack>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>{c.contacto}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
