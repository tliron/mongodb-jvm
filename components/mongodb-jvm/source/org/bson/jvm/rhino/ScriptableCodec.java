/**
 * Copyright 2010-2017 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.rhino;

import org.bson.BsonReader;
import org.bson.BsonType;
import org.bson.BsonWriter;
import org.bson.codecs.BsonTypeClassMap;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.jvm.internal.BsonUtil;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import com.mongodb.jvm.json.rhino.DBRefTransformer;

/**
 * A BSON codec for Rhino's native {@link Scriptable}. Delegates to
 * {@link NativeDateCodec} and {@link NativeRegExpCodec} if necessary (those
 * classes are private in Rhino).
 * 
 * @author Tal Liron
 */
@SuppressWarnings("rawtypes")
public class ScriptableCodec implements Codec
{
	//
	// Construction
	//

	/**
	 * Constructor.
	 * 
	 * @param codecRegistry
	 *        The codec registry
	 * @param bsonTypeClassMap
	 *        The BSON type class map
	 */
	public ScriptableCodec( CodecRegistry codecRegistry, BsonTypeClassMap bsonTypeClassMap )
	{
		this.codecRegistry = codecRegistry;
		this.bsonTypeClassMap = bsonTypeClassMap;
	}

	//
	// Codec
	//

	public Class getEncoderClass()
	{
		return Scriptable.class;
	}

	public void encode( BsonWriter writer, Object object, EncoderContext encoderContext )
	{
		Scriptable scriptable = (Scriptable) object;

		String className = scriptable.getClassName();
		if( className.equals( "Date" ) )
		{
			new NativeDateCodec().encode( writer, scriptable, encoderContext );
			return;
		}
		else if( className.equals( "RegExp" ) )
		{
			new NativeRegExpCodec().encode( writer, scriptable, encoderContext );
			return;
		}

		writer.writeStartDocument();
		Object[] ids = scriptable.getIds();
		for( Object id : ids )
		{
			String key = id.toString();
			Object value = ScriptableObject.getProperty( scriptable, key );
			writer.writeName( key );
			BsonUtil.writeChild( value, writer, encoderContext, codecRegistry );
		}
		writer.writeEndDocument();
	}

	public Object decode( BsonReader reader, DecoderContext decoderContext )
	{
		Context context = Context.getCurrentContext();
		Scriptable scope = ScriptRuntime.getTopCallScope( context );
		Scriptable scriptable = context.newObject( scope );

		reader.readStartDocument();
		while( reader.readBsonType() != BsonType.END_OF_DOCUMENT )
		{
			String key = reader.readName();
			Object value = BsonUtil.read( reader, decoderContext, codecRegistry, bsonTypeClassMap );
			scriptable.put( key, scriptable, value );
		}
		reader.readEndDocument();

		// The driver does not support decoding DBRef, so we'll do it here
		Object dbRef = new DBRefTransformer().transform( scriptable, null );
		if( dbRef != null )
			return dbRef;

		return scriptable;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private final CodecRegistry codecRegistry;

	private final BsonTypeClassMap bsonTypeClassMap;
}
