import { Flex, IconButton, InputGroup, InputLeftElement, Input, Spacer, useColorMode, HStack, Avatar, Text, Tooltip, Select } from '@chakra-ui/react'
import { FiSearch, FiMoon, FiSun, FiMinimize2, FiMaximize2 } from 'react-icons/fi'
import { useDemo } from '../../context/DemoContext'

export default function NavBar() {
  const { colorMode, toggleColorMode } = useColorMode()
  const { scenario, setScenario, scenarioOptions, presentationMode, togglePresentation } = useDemo()
  return (
    <Flex as="header" p={4} borderBottomWidth="1px" bg="white" _dark={{ bg: 'gray.800' }} position="sticky" top={0} zIndex={1}>
      <InputGroup maxW="560px">
        <InputLeftElement pointerEvents="none">
          <FiSearch />
        </InputLeftElement>
        <Input placeholder="Buscar (proyectos, tareas, personas)" variant="filled" />
      </InputGroup>
      <Spacer />
      <HStack spacing={2}>
        <Select value={scenario} onChange={(e) => setScenario(e.target.value as any)} size="sm" maxW="220px">
          {scenarioOptions.map(opt => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </Select>
        <Tooltip label={presentationMode ? 'Salir de modo presentación' : 'Entrar a modo presentación'}>
          <IconButton aria-label="toggle presentation" variant="ghost" icon={presentationMode ? <FiMinimize2 /> : <FiMaximize2 />} onClick={togglePresentation} />
        </Tooltip>
        <Tooltip label={colorMode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
          <IconButton aria-label="alternar tema" variant="ghost" icon={colorMode === 'light' ? <FiMoon /> : <FiSun />} onClick={toggleColorMode} />
        </Tooltip>
        <HStack spacing={3}>
          <Avatar name="Alex Doe" size="sm" />
          <Text fontWeight="medium" display={{ base: 'none', md: 'block' }}>Alex Doe</Text>
        </HStack>
      </HStack>
    </Flex>
  )
}
