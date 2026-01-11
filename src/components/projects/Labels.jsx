import { useEffect, useState } from 'react'
import * as lucide from 'react-icons/lu'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase-client'
import { Card, CardContent, CardHeader } from '../Card'
import { DropdownMenu } from '../DropdownMenu'
import { IoIosMore } from "react-icons/io";
import { CreateLabelModal } from '../modals/CreateLabelModal'
import { EditLabelModal } from '../modals/EditLabelModal'
import { DeleteLabelModal } from '../modals/DeleteLabelModal'

export const LabelsTab = ({ projectId, setLabelAmount }) => {

    const [labels, setLabels] = useState([])
    const [loading, setLoading] = useState(true);

    const [showCreateLabelModal, setShowCreateLabelModal] = useState(false)
    const [showEditLabelModal, setShowEditLabelModal] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(null)
    

    const loadData = async () => {
        if (!projectId) return; 
        setLoading(true)
        const { data: labelData, error: labelDataError } = await supabase
            .from('labels')
            .select('*')
            .eq('project_id', projectId)

        if (labelDataError) console.error(labelDataError)

        setLabels(labelData || [])
        setLabelAmount(labelData?.length || 0)
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [projectId])


    if (loading) {
        return (
            <div className="w-full py-10 flex justify-center items-center">
                <lucide.LuLoaderCircle className='h-12 w-12 text-white animate-spin'/>
            </div>
        )
    }

    return (
        <>
            <div className="flex w-full flex-col gap-4 justify-end items-center">
                <div className="flex w-full justify-between mb-4 items-center">
                    <h2 className='text-white text-3xl font-bold'>Project Labels</h2>
                    <button
                        onClick={() => setShowCreateLabelModal(true)} 
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-5 py-2 flex items-center gap-2"
                    >
                        <lucide.LuPlus className="h-4 w-4" />
                        New Label
                    </button>
                </div>
                {labels.length === 0 ?
                    <Card
                        onClick={() => setShowCreateLabelModal(true)}
                        className="hover:border-blue-500/50 transition-colors cursor-pointer border-dashed h-full min-h-50 flex items-center justify-center"
                    >
                        <CardContent className='text-center p-6'>
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                <lucide.LuPlus className="w-5 h-5 text-gray-400"/>
                            </div>
                            <p className="font-medium">No Labels yet</p>
                            <p className="text-sm text-gray-400">Create labels to categorize your issues</p>
                        </CardContent>
                    </Card>
                :
                    <div className='grid gap-3 w-full'>
                        {labels.map((label, index) => (

                                <motion.div 
                                    key={label.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className='relative'
                                >
                                    <Card className='relative'>
                                        <CardContent className='p-4 flex items-center justify-between'>
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className='w-4 h-4 rounded-full'
                                                    style={{ backgroundColor: label.color }}
                                                />
                                                <span className="font-medium">{label.name}</span>
                                            </div>
                                            <DropdownMenu
                                                trigger={
                                                    <button className='w-8 h-8 flex cursor-pointer justify-center items-center bg-transparent hover:bg-gray-500/60 rounded-lg transition-all'>
                                                        <IoIosMore className='h-4 w-4' />
                                                    </button>
                                                }
                                                items={[
                                                    { label: 'Edit', icon: lucide.LuPencil, className: '', onClick: () => setShowEditLabelModal(label.id) },
                                                    { label: 'Delete', icon: lucide.LuTrash2, className: 'hover:text-red-500', onClick: () => setShowDeleteModal(label.id) },
                                                ]}
                                            />
                                        </CardContent>
                                    </Card>

                                    <EditLabelModal 
                                        open={showEditLabelModal === label.id}
                                        onClose={() => setShowEditLabelModal(null)}
                                        onEdit={loadData}
                                        name={label.name}
                                        color={label.color}
                                        labelId={label.id}
                                    />
                                    <DeleteLabelModal 
                                        open={showDeleteModal === label.id}
                                        onClose={() => setShowDeleteModal(null)}
                                        onDelete={loadData}
                                        name={label.name}
                                        labelId={label.id}
                                    />
                                    
                                </motion.div>

                        ))

                        }
                    </div>
                }
            </div>
            
            <CreateLabelModal 
                open={showCreateLabelModal}
                onClose={() => setShowCreateLabelModal(false)}
                onCreate={loadData}
                projectId={projectId}
            />
        </>
    )
}