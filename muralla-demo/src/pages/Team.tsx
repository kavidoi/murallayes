import { Avatar, Box, Heading, HStack, Input, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useDemo } from '../context/DemoContext'

export default function Team() {
  const { data } = useDemo()
  const [q, setQ] = useState('')
  const filtered = useMemo(() => data.team.filter((m: any) => (m.name + m.role + m.email).toLowerCase().includes(q.toLowerCase())), [q, data.team])

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Heading size="lg">Equipo</Heading>
        <Input placeholder="Buscar en equipo" value={q} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} maxW="320px" />
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {filtered.map((m: any) => (
          <Box key={m.id} p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
            <HStack spacing={4}>
              <Avatar name={m.name} />
              <VStack align="start" spacing={0}>
                <Text fontWeight="semibold">{m.name}</Text>
                <Text color="gray.600" _dark={{ color: 'gray.400' }}>{m.role}</Text>
                <Text fontSize="sm" color="gray.500">{m.email}</Text>
              </VStack>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
