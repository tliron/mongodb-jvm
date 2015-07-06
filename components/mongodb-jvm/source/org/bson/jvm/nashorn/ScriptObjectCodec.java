/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.nashorn;

import org.bson.BsonReader;
import org.bson.BsonType;
import org.bson.BsonWriter;
import org.bson.codecs.BsonTypeClassMap;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.jvm.internal.BsonUtil;

import com.mongodb.DBRef;

import jdk.nashorn.internal.objects.Global;
import jdk.nashorn.internal.runtime.ScriptObject;
import jdk.nashorn.internal.runtime.Undefined;

/**
 * A BSON codec for a Nashorn {@link ScriptObject}.
 * 
 * @author Tal Liron
 */
@SuppressWarnings("rawtypes")
public class ScriptObjectCodec implements Codec
{
	//
	// Construction
	//

	public ScriptObjectCodec( CodecRegistry codecRegistry, BsonTypeClassMap bsonTypeClassMap )
	{
		this.codecRegistry = codecRegistry;
		this.bsonTypeClassMap = bsonTypeClassMap;
	}

	//
	// Codec
	//

	public Class getEncoderClass()
	{
		return ScriptObject.class;
	}

	public void encode( BsonWriter writer, Object object, EncoderContext encoderContext )
	{
		ScriptObject scriptObject = (ScriptObject) object;

		writer.writeStartDocument();
		for( String key : scriptObject.getOwnKeys( true ) )
		{
			Object value = scriptObject.get( key );
			writer.writeName( key );
			BsonUtil.writeChild( value, writer, encoderContext, codecRegistry );
		}
		writer.writeEndDocument();
	}

	public Object decode( BsonReader reader, DecoderContext decoderContext )
	{
		ScriptObject scriptObject = Global.newEmptyInstance();

		reader.readStartDocument();
		while( reader.readBsonType() != BsonType.END_OF_DOCUMENT )
		{
			String key = reader.readName();
			Object value = BsonUtil.read( reader, decoderContext, codecRegistry, bsonTypeClassMap );
			scriptObject.put( key, value, false );
		}
		reader.readEndDocument();

		// The driver does not support decoding DBRef, so we'll do it here
		Object ref = scriptObject.get( "$ref" );
		if( ( ref != null ) && ( ref.getClass() != Undefined.class ) )
		{
			Object id = scriptObject.get( "$id" );
			if( ( id != null ) && ( id.getClass() != Undefined.class ) )
				return new DBRef( ref.toString(), id );
		}

		return scriptObject;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private final CodecRegistry codecRegistry;

	private final BsonTypeClassMap bsonTypeClassMap;
}
